"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function getRowField(row, fieldName) {
  const key = Object.keys(row).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? String(row[key] ?? "") : "";
}

function getSelectedUnitIds(selectedUnitIds) {
  return Object.entries(selectedUnitIds)
    .filter(([, isSelected]) => isSelected)
    .map(([unitId]) => Number(unitId));
}

export default function UnitOwnersForm() {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("0");
  const [voters, setVoters] = useState([]);
  const [selectedVoterId, setSelectedVoterId] = useState("0");
  const [units, setUnits] = useState([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState({});
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [buildingsError, setBuildingsError] = useState(null);
  const [votersError, setVotersError] = useState(null);
  const [unitsError, setUnitsError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saving, setSaving] = useState(false);

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
      const { data, error } = await supabase.rpc("pr_voters_by_building", {
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

  async function loadUnits(buildingId) {
    if (buildingId === "0") {
      setUnits([]);
      setUnitsError(null);
      return;
    }

    setLoadingUnits(true);
    setUnitsError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_munits_by_building", {
        p_building_id: Number(buildingId),
      });

      if (error) {
        throw error;
      }

      setUnits(data ?? []);
    } catch (loadError) {
      setUnits([]);
      setUnitsError(
        loadError instanceof Error ? loadError.message : "Could not load units."
      );
    } finally {
      setLoadingUnits(false);
    }
  }

  function getUnitLabel(unitRow) {
    return getRowField(unitRow, "name") || getRowField(unitRow, "unit");
  }

  useEffect(() => {
    loadBuildings();
  }, []);

  function handleBuildingChange(event) {
    const buildingId = event.target.value;
    setSelectedBuildingId(buildingId);
    setSelectedVoterId("0");
    setSelectedUnitIds({});
    loadVoters(buildingId);
    loadUnits(buildingId);
  }

  async function handleVoterChange(event) {
    const voterId = event.target.value;
    setSelectedVoterId(voterId);
    setSelectedUnitIds({});
    setSaveError(null);

    if (voterId === "0" || selectedBuildingId === "0") {
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        "pr_munits_by_building_and_voter",
        {
          p_building_id: Number(selectedBuildingId),
          p_voter_id: Number(voterId),
        }
      );

      if (error) {
        setSaveError(error.message);
        return;
      }

      const nextSelectedUnitIds = {};

      for (const unitRow of data ?? []) {
        const unitId = getRowField(unitRow, "id");

        if (unitId) {
          nextSelectedUnitIds[String(unitId)] = true;
        }
      }

      setSelectedUnitIds(nextSelectedUnitIds);
    } catch (loadError) {
      setSaveError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load units for this voter."
      );
    }
  }

  function handleUnitCheckboxChange(unitId, checked) {
    setSelectedUnitIds((current) => ({
      ...current,
      [String(unitId)]: checked,
    }));
  }

  function handleClear() {
    setSelectedVoterId("0");
    setSelectedUnitIds({});
    setSaveError(null);
    setSaveMessage(null);
  }

  async function handleSave() {
    setSaveError(null);
    setSaveMessage(null);

    if (selectedBuildingId === "0") {
      setSaveError("Please select a building.");
      return;
    }

    if (selectedVoterId === "0") {
      setSaveError("Please select a voter.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const buildingId = Number(selectedBuildingId);
      const voterId = Number(selectedVoterId);

      const { error: deleteError } = await supabase.rpc(
        "pd_munits_by_building_and_voter",
        {
          p_building_id: buildingId,
          p_voter_id: voterId,
        }
      );

      if (deleteError) {
        setSaveError(deleteError.message);
        return;
      }

      const checkedUnitIds = getSelectedUnitIds(selectedUnitIds);

      for (const unitId of checkedUnitIds) {
        const { error: linkError } = await supabase.rpc("pi_munit_voter", {
          p_unit_id: unitId,
          p_voter_id: voterId,
        });

        if (linkError) {
          setSaveError(linkError.message);
          return;
        }
      }

      setSaveMessage("Unit owner saved successfully.");
    } catch (saveFailure) {
      setSaveError(
        saveFailure instanceof Error
          ? saveFailure.message
          : "Could not save unit owner."
      );
    } finally {
      setSaving(false);
    }
  }

  const isBusy = saving;

  return (
    <div className="space-y-4">
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
          htmlFor="voters"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Voters
        </label>
        <select
          id="voters"
          name="voters"
          value={selectedVoterId}
          onChange={handleVoterChange}
          disabled={loadingVoters || selectedBuildingId === "0"}
          className={selectClassName}
        >
          <option value="0">- SELECT -</option>
          {voters.map((voter) => (
            <option key={getRowField(voter, "id")} value={getRowField(voter, "id")}>
              {getRowField(voter, "name")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Units
        </span>
        {selectedBuildingId === "0" ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Select a building to view units.
          </p>
        ) : loadingUnits ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading units...
          </p>
        ) : units.length ? (
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-300 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
            {units.map((unitRow) => {
              const unitId = getRowField(unitRow, "id");

              return (
                <label
                  key={unitId}
                  className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(selectedUnitIds[unitId])}
                    onChange={(event) =>
                      handleUnitCheckboxChange(unitId, event.target.checked)
                    }
                  />
                  <span>{getUnitLabel(unitRow)}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No units found for this building.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 items-center gap-4">
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
          disabled={isBusy}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/50 px-5 text-sm font-medium text-blue-950 transition-colors hover:bg-blue-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-400/30 dark:bg-blue-500/30 dark:text-blue-50 dark:hover:bg-blue-500/50"
        >
          {saving ? "Saving..." : "Save"}
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

      {votersError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {votersError}
        </p>
      ) : null}

      {unitsError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {unitsError}
        </p>
      ) : null}
    </div>
  );
}
