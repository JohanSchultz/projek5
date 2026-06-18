"use client";

import VotersGrid from "./voters-grid";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function getVoterField(voterRow, fieldName) {
  const key = Object.keys(voterRow).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? String(voterRow[key] ?? "") : "";
}

export default function VotersForm() {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("0");
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

  async function loadVoters(buildingId) {
    if (buildingId === "0") {
      setVoters([]);
      setVotersError(null);
      return;
    }

    setLoadingVoters(true);
    setVotersError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_voters", {
        p_building_id: Number(buildingId),
      });

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
  }, []);

  function handleBuildingChange(event) {
    const buildingId = event.target.value;
    setSelectedBuildingId(buildingId);
    setVoterId("");
    setSelectedGridVoterId(null);
    setVoter("");
    setIdNumber("");
    setSaveError(null);
    setSaveMessage(null);
    loadVoters(buildingId);
  }

  function handleClear() {
    setSelectedBuildingId("0");
    setVoterId("");
    setSelectedGridVoterId(null);
    setVoter("");
    setIdNumber("");
    setVoters([]);
    setVotersError(null);
    setSaveError(null);
    setSaveMessage(null);
  }

  function handleVoterSelect(voterRow) {
    setSaveError(null);
    setSaveMessage(null);
    setSelectedGridVoterId(voterRow.id);
    setVoterId(getVoterField(voterRow, "id"));
    setVoter(getVoterField(voterRow, "name"));
    setIdNumber(getVoterField(voterRow, "idnumber"));
  }

  async function handleSave() {
    setSaveError(null);
    setSaveMessage(null);

    if (!voter.trim()) {
      return;
    }

    if (selectedBuildingId === "0") {
      setSaveError("Please select a building.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pi_voters", {
        p_idnumber: idNumber,
        p_name: voter.trim(),
        p_building_id: Number(selectedBuildingId),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      setVoterId("");
      setSelectedGridVoterId(null);
      setVoter("");
      setIdNumber("");
      await loadVoters(selectedBuildingId);
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

    if (selectedBuildingId === "0") {
      setSaveError("Please select a building.");
      return;
    }

    setUpdating(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pu_voters", {
        p_id: Number(voterId),
        p_idnumber: idNumber,
        p_name: voter.trim(),
        p_building_id: Number(selectedBuildingId),
        p_is_active: true,
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      setVoterId("");
      setSelectedGridVoterId(null);
      setVoter("");
      setIdNumber("");
      await loadVoters(selectedBuildingId);
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
      await loadVoters(selectedBuildingId);
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
          htmlFor="buildingName"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Building Name
        </label>
        <select
          id="buildingName"
          name="buildingName"
          value={selectedBuildingId}
          onChange={handleBuildingChange}
          disabled={loadingBuildings}
          className={selectClassName}
        >
          <option value="0">- SELECT -</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </select>
      </div>

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
