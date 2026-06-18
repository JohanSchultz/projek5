"use client";

import BuildingsGrid from "./buildings-grid";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export default function BuildingsForm() {
  const [buildingName, setBuildingName] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [selectedGridBuildingId, setSelectedGridBuildingId] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [buildingsError, setBuildingsError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);

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

  useEffect(() => {
    loadBuildings();
  }, []);

  function handleClear() {
    setBuildingName("");
    setBuildingId("");
    setSelectedGridBuildingId(null);
    setSaveError(null);
    setSaveMessage(null);
  }

  function handleBuildingSelect(building) {
    setSaveError(null);
    setSaveMessage(null);
    setSelectedGridBuildingId(building.id);
    setBuildingId(String(building.id));
    setBuildingName(building.name ?? "");
  }

  async function handleSave() {
    setSaveError(null);
    setSaveMessage(null);

    if (!buildingName.trim()) {
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.rpc("pi_mbuilding", {
      p_name: buildingName.trim(),
    });

    setSaving(false);

    if (error) {
      setSaveError(error.message);
      return;
    }

    handleClear();
    await loadBuildings();
    setSaveMessage("Building saved successfully.");
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

    const supabase = createClient();
    const { error } = await supabase.rpc("pu_mbuilding", {
      p_id: Number(buildingId),
      p_name: buildingName.trim(),
    });

    setUpdating(false);

    if (error) {
      setSaveError(error.message);
      return;
    }

    handleClear();
    await loadBuildings();
    setSaveMessage("Building updated successfully.");
  }

  const isEditing = Boolean(buildingId);

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

      <div className="grid grid-cols-3 items-center gap-4">
        <div className="justify-self-start">
          <button
            type="button"
            onClick={handleClear}
            disabled={saving || updating}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Clear
          </button>
        </div>

        <div className="justify-self-center">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || updating || isEditing}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/50 px-5 text-sm font-medium text-blue-950 transition-colors hover:bg-blue-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-400/30 dark:bg-blue-500/30 dark:text-blue-50 dark:hover:bg-blue-500/50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="justify-self-end">
          <button
            type="button"
            onClick={handleChange}
            disabled={saving || updating || !isEditing}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/50 px-5 text-sm font-medium text-orange-950 transition-colors hover:bg-orange-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-orange-400/30 dark:bg-orange-500/30 dark:text-orange-50 dark:hover:bg-orange-500/50"
          >
            {updating ? "Changing..." : "Change"}
          </button>
        </div>
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

      <BuildingsGrid
        buildings={buildings}
        loading={loadingBuildings}
        selectedBuildingId={selectedGridBuildingId}
        onSelectBuilding={handleBuildingSelect}
      />

      {buildingsError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {buildingsError}
        </p>
      ) : null}
    </div>
  );
}
