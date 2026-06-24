"use client";

import VotersGrid from "./voters-grid";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function getVoterField(voterRow, fieldName) {
  const key = Object.keys(voterRow).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? String(voterRow[key] ?? "") : "";
}

function getSelectedBuildingIds(selectedBuildingIds) {
  return Object.entries(selectedBuildingIds)
    .filter(([, isSelected]) => isSelected)
    .map(([buildingId]) => Number(buildingId));
}

function parseInsertedId(data) {
  if (typeof data === "number") {
    return data;
  }

  if (typeof data === "string" && data.trim() !== "") {
    return Number(data);
  }

  if (Array.isArray(data) && data.length > 0) {
    const row = data[0];

    if (typeof row === "number") {
      return row;
    }

    if (typeof row === "object" && row !== null) {
      return Number(row.id ?? Object.values(row)[0]);
    }
  }

  if (typeof data === "object" && data !== null && data.id != null) {
    return Number(data.id);
  }

  return null;
}

export default function VotersForm() {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingIds, setSelectedBuildingIds] = useState({});
  const [voterId, setVoterId] = useState("");
  const [selectedGridVoterId, setSelectedGridVoterId] = useState(null);
  const [voter, setVoter] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [voters, setVoters] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [buildingsError, setBuildingsError] = useState(null);
  const [votersError, setVotersError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadBuildings() {
    setLoadingBuildings(true);
    setBuildingsError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_mbuildings");

      if (error) {
        throw error;
      }

      setBuildings(data ?? []);
    } catch (loadError) {
      setBuildings([]);
      setBuildingsError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load buildings."
      );
    } finally {
      setLoadingBuildings(false);
    }
  }

  async function loadVoters() {
    setLoadingVoters(true);
    setVotersError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_voters_all");

      if (error) {
        throw error;
      }

      setVoters(data ?? []);
    } catch (loadError) {
      setVoters([]);
      setVotersError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load voters."
      );
    } finally {
      setLoadingVoters(false);
    }
  }

  useEffect(() => {
    loadBuildings();
    loadVoters();
  }, []);

  function handleBuildingCheckboxChange(buildingId, checked) {
    setSelectedBuildingIds((current) => ({
      ...current,
      [String(buildingId)]: checked,
    }));
  }

  function handleClear() {
    setSelectedBuildingIds({});
    setVoterId("");
    setSelectedGridVoterId(null);
    setVoter("");
    setIdNumber("");
    setVotersError(null);
    setSaveError(null);
    setSaveMessage(null);
    loadVoters();
  }

  async function handleVoterSelect(voterRow) {
    setSaveError(null);
    setSaveMessage(null);
    setSelectedGridVoterId(voterRow.id);

    const selectedVoterId = getVoterField(voterRow, "id");

    setVoterId(selectedVoterId);
    setVoter(getVoterField(voterRow, "name"));
    setIdNumber(getVoterField(voterRow, "idnumber"));
    setSelectedBuildingIds({});

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_buildings_by_voter", {
        p_voter_id: Number(selectedVoterId),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      const nextSelectedBuildingIds = {};

      for (const buildingRow of data ?? []) {
        const buildingId = getVoterField(buildingRow, "id");

        if (buildingId) {
          nextSelectedBuildingIds[String(buildingId)] = true;
        }
      }

      setSelectedBuildingIds(nextSelectedBuildingIds);
    } catch (loadError) {
      setSaveError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load buildings for this voter."
      );
    }
  }

  async function handleSave() {
    setSaveError(null);
    setSaveMessage(null);

    if (!voter.trim()) {
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pi_voters", {
        p_idnumber: idNumber,
        p_name: voter.trim(),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      const newVoterId = parseInsertedId(data);

      if (newVoterId == null || Number.isNaN(newVoterId)) {
        setSaveError("Voter was saved, but the new voter id could not be read.");
        return;
      }

      setVoterId(String(newVoterId));

      const checkedBuildingIds = getSelectedBuildingIds(selectedBuildingIds);

      for (const buildingId of checkedBuildingIds) {
        const { error: linkError } = await supabase.rpc("pi_voter_building", {
          p_voter_id: newVoterId,
          p_building_id: buildingId,
        });

        if (linkError) {
          setSaveError(linkError.message);
          return;
        }
      }

      setSelectedGridVoterId(null);
      setVoter("");
      setIdNumber("");
      setSelectedBuildingIds({});
      await loadVoters();
      setSaveMessage("Voter saved successfully.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChange() {
    setSaveError(null);
    setSaveMessage(null);

    if (!voterId) {
      setSaveError("Please select a voter from the grid.");
      return;
    }

    if (!voter.trim()) {
      setSaveError("Please enter a voter name.");
      return;
    }

    setUpdating(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pu_voters", {
        p_id: Number(voterId),
        p_idnumber: idNumber,
        p_name: voter.trim(),
        p_is_active: true,
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      const checkedBuildingIds = getSelectedBuildingIds(selectedBuildingIds);

      for (const buildingId of checkedBuildingIds) {
        const { error: linkError } = await supabase.rpc("pi_voter_building", {
          p_voter_id: Number(voterId),
          p_building_id: buildingId,
        });

        if (linkError) {
          setSaveError(linkError.message);
          return;
        }
      }

      setVoterId("");
      setSelectedGridVoterId(null);
      setVoter("");
      setIdNumber("");
      setSelectedBuildingIds({});
      await loadVoters();
      setSaveMessage("Voter updated successfully.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    setSaveError(null);
    setSaveMessage(null);

    if (!voterId) {
      setSaveError("Please select a voter from the grid.");
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pd_voters", {
        p_id: Number(voterId),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      setVoterId("");
      setSelectedGridVoterId(null);
      setVoter("");
      setIdNumber("");
      setSelectedBuildingIds({});
      await loadVoters();
      setSaveMessage("Voter deleted successfully.");
    } finally {
      setDeleting(false);
    }
  }

  const isEditing = selectedGridVoterId !== null;
  const isBusy = saving || updating || deleting;

  return (
    <div className="space-y-4">
      <input
        id="voterId"
        name="voterId"
        type="text"
        readOnly
        value={voterId}
        hidden
      />

      <div>
        <label
          htmlFor="voter"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Voter
        </label>
        <input
          id="voter"
          name="voter"
          type="text"
          value={voter}
          onChange={(event) => setVoter(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="idNumber"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          ID Number
        </label>
        <input
          id="idNumber"
          name="idNumber"
          type="text"
          value={idNumber}
          onChange={(event) => setIdNumber(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Buildings
        </span>
        {loadingBuildings ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading buildings...
          </p>
        ) : buildings.length ? (
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-300 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
            {buildings.map((building) => (
              <label
                key={building.id}
                className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <input
                  type="checkbox"
                  checked={Boolean(selectedBuildingIds[String(building.id)])}
                  onChange={(event) =>
                    handleBuildingCheckboxChange(
                      building.id,
                      event.target.checked
                    )
                  }
                />
                <span>{building.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No buildings found.
          </p>
        )}
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <button
          type="button"
          onClick={handleClear}
          disabled={isBusy}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy || isEditing}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/50 px-5 text-sm font-medium text-blue-950 transition-colors hover:bg-blue-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-400/30 dark:bg-blue-500/30 dark:text-blue-50 dark:hover:bg-blue-500/50"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={handleChange}
          disabled={isBusy || !isEditing}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/50 px-5 text-sm font-medium text-orange-950 transition-colors hover:bg-orange-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-orange-400/30 dark:bg-orange-500/30 dark:text-orange-50 dark:hover:bg-orange-500/50"
        >
          {updating ? "Changing..." : "Change"}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isBusy || !isEditing}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-red-500/40 bg-red-500/50 px-5 text-sm font-medium text-red-950 transition-colors hover:bg-red-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400/30 dark:bg-red-500/30 dark:text-red-50 dark:hover:bg-red-500/50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {saveMessage ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {saveMessage}
        </p>
      ) : null}

      {saveError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {saveError}
        </p>
      ) : null}

      {buildingsError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {buildingsError}
        </p>
      ) : null}

      <VotersGrid
        voters={voters}
        loading={loadingVoters}
        selectedVoterId={selectedGridVoterId}
        onSelectVoter={handleVoterSelect}
      />

      {votersError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {votersError}
        </p>
      ) : null}
    </div>
  );
}
