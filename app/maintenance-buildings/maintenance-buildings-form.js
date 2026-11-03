"use client";

import MaintenanceBuildingsGrid from "./maintenance-buildings-grid";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function getBuildingField(buildingRow, fieldName) {
  const key = Object.keys(buildingRow).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? buildingRow[key] : undefined;
}

function parseIsActive(value) {
  return (
    value === true || value === "true" || value === 1 || value === "1"
  );
}

export default function MaintenanceBuildingsForm() {
  const [buildingId, setBuildingId] = useState("");
  const [selectedGridBuildingId, setSelectedGridBuildingId] = useState(null);
  const [buildingName, setBuildingName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [buildings, setBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [buildingsError, setBuildingsError] = useState(null);
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
      const { data, error } = await supabase.rpc("pr_buildings");

      if (error) {
        throw error;
      }

      const buildingRows = [...(data ?? [])].sort((a, b) =>
        String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
          sensitivity: "base",
        })
      );

      setBuildings(buildingRows);
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

  useEffect(() => {
    loadBuildings();
  }, []);

  function handleClear() {
    setBuildingId("");
    setSelectedGridBuildingId(null);
    setBuildingName("");
    setIsActive(true);
    setSaveError(null);
    setSaveMessage(null);
  }

  function handleBuildingSelect(buildingRow) {
    setSaveError(null);
    setSaveMessage(null);
    setSelectedGridBuildingId(buildingRow.id);
    setBuildingId(String(getBuildingField(buildingRow, "id") ?? ""));
    setBuildingName(String(getBuildingField(buildingRow, "name") ?? ""));
    setIsActive(parseIsActive(getBuildingField(buildingRow, "is_active")));
  }

  async function handleSave() {
    setSaveError(null);
    setSaveMessage(null);

    if (!buildingName.trim()) {
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pi_building", {
        p_name: buildingName.trim(),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      handleClear();
      await loadBuildings();
      setSaveMessage("Building saved successfully.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChange() {
    setSaveError(null);
    setSaveMessage(null);

    if (!buildingId) {
      setSaveError("Please select a building from the grid.");
      return;
    }

    if (!buildingName.trim()) {
      setSaveError("Please enter a building name.");
      return;
    }

    setUpdating(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pu_building", {
        p_id: Number(buildingId),
        p_name: buildingName.trim(),
        p_is_active: isActive,
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      await loadBuildings();
      handleClear();
      setSaveMessage("Building updated successfully.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    setSaveError(null);
    setSaveMessage(null);

    if (!buildingId) {
      setSaveError("Please select a building from the grid.");
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pd_building", {
        p_id: Number(buildingId),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      handleClear();
      await loadBuildings();
      setSaveMessage("Building deleted successfully.");
    } finally {
      setDeleting(false);
    }
  }

  const isEditing = selectedGridBuildingId !== null;
  const isBusy = saving || updating || deleting;

  return (
    <div className="space-y-4">
      <input
        id="buildingId"
        name="buildingId"
        type="text"
        readOnly
        value={buildingId}
        hidden
      />

      <div className="grid grid-cols-2 items-end gap-6">
        <div>
          <label
            htmlFor="buildingName"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Building Name
          </label>
          <input
            id="buildingName"
            name="buildingName"
            type="text"
            value={buildingName}
            onChange={(event) => setBuildingName(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Active
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            aria-label="Active"
            onClick={() => setIsActive((current) => !current)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
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

      <MaintenanceBuildingsGrid
        buildings={buildings}
        loading={loadingBuildings}
        selectedBuildingId={selectedGridBuildingId}
        onSelectBuilding={handleBuildingSelect}
      />
    </div>
  );
}
