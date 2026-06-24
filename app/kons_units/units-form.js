"use client";

import UnitsGrid from "./units-grid";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const narrowFieldClassName = "w-[35%]";

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function getUnitField(unitRow, fieldName) {
  const key = Object.keys(unitRow).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? String(unitRow[key] ?? "") : "";
}

function isValidWeightInput(value) {
  return value === "" || /^\d*\.?\d{0,3}$/.test(value);
}

export default function UnitsForm() {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("0");
  const [unitId, setUnitId] = useState("");
  const [selectedGridUnitId, setSelectedGridUnitId] = useState(null);
  const [unit, setUnit] = useState("");
  const [weight, setWeight] = useState("");
  const [units, setUnits] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [buildingsError, setBuildingsError] = useState(null);
  const [unitsError, setUnitsError] = useState(null);
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
      const { data, error } = await supabase.rpc("pr_munits", {
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

  useEffect(() => {
    loadBuildings();
  }, []);

  function handleBuildingChange(event) {
    const buildingId = event.target.value;
    setSelectedBuildingId(buildingId);
    setUnitId("");
    setSelectedGridUnitId(null);
    setUnit("");
    setWeight("");
    setSaveError(null);
    setSaveMessage(null);
    loadUnits(buildingId);
  }

  function handleClear() {
    setUnitId("");
    setSelectedGridUnitId(null);
    setUnit("");
    setWeight("");
    setSaveError(null);
    setSaveMessage(null);
  }

  function handleWeightChange(event) {
    const value = event.target.value;

    if (isValidWeightInput(value)) {
      setWeight(value);
    }
  }

  function handleUnitSelect(unitRow) {
    setSaveError(null);
    setSaveMessage(null);
    setSelectedGridUnitId(unitRow.id);
    setUnitId(getUnitField(unitRow, "id"));
    setUnit(getUnitField(unitRow, "unit") || getUnitField(unitRow, "name"));
    setWeight(getUnitField(unitRow, "weight"));
  }

  async function handleSave() {
    setSaveError(null);
    setSaveMessage(null);

    if (selectedBuildingId === "0") {
      setSaveError("Please select a building.");
      return;
    }

    if (!unit.trim()) {
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pi_munits", {
        p_building_id: Number(selectedBuildingId),
        p_name: unit.trim(),
        p_weight: Number(weight),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      setUnitId("");
      setSelectedGridUnitId(null);
      setUnit("");
      setWeight("");
      await loadUnits(selectedBuildingId);
      setSaveMessage("Unit saved successfully.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChange() {
    setSaveError(null);
    setSaveMessage(null);

    if (!unitId) {
      setSaveError("Please select a unit from the grid.");
      return;
    }

    if (selectedBuildingId === "0") {
      setSaveError("Please select a building.");
      return;
    }

    if (!unit.trim()) {
      setSaveError("Please enter a unit name.");
      return;
    }

    setUpdating(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pu_munits", {
        p_id: Number(unitId),
        p_building_id: Number(selectedBuildingId),
        p_name: unit.trim(),
        p_weight: Number(weight),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      setUnitId("");
      setSelectedGridUnitId(null);
      setUnit("");
      setWeight("");
      await loadUnits(selectedBuildingId);
      setSaveMessage("Unit updated successfully.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    setSaveError(null);
    setSaveMessage(null);

    if (!unitId) {
      setSaveError("Please select a unit from the grid.");
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pd_munits", {
        p_id: Number(unitId),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      setUnitId("");
      setSelectedGridUnitId(null);
      setUnit("");
      setWeight("");
      await loadUnits(selectedBuildingId);
      setSaveMessage("Unit deleted successfully.");
    } finally {
      setDeleting(false);
    }
  }

  const isEditing = selectedGridUnitId !== null;
  const isBusy = saving || updating || deleting;

  return (
    <div className="space-y-4">
      <input
        id="unitId"
        name="unitId"
        type="text"
        readOnly
        value={unitId}
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

      <div className="flex items-start gap-4">
        <div className={narrowFieldClassName}>
          <label
            htmlFor="unit"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Unit
          </label>
          <input
            id="unit"
            name="unit"
            type="text"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className={narrowFieldClassName}>
          <label
            htmlFor="weight"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Weight
          </label>
          <input
            id="weight"
            name="weight"
            type="text"
            inputMode="decimal"
            value={weight}
            onChange={handleWeightChange}
            className={inputClassName}
          />
        </div>
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

      <UnitsGrid
        units={units}
        loading={loadingUnits}
        selectedUnitId={selectedGridUnitId}
        onSelectUnit={handleUnitSelect}
      />

      {unitsError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {unitsError}
        </p>
      ) : null}
    </div>
  );
}
