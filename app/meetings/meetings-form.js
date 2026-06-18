"use client";

import MeetingsGrid from "./meetings-grid";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function getMeetingField(meetingRow, fieldName) {
  const key = Object.keys(meetingRow).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? String(meetingRow[key] ?? "") : "";
}

function formatDateForInput(dateString) {
  if (!dateString) {
    return "";
  }

  return dateString.split("T")[0];
}

export default function MeetingsForm() {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("0");
  const [meetingId, setMeetingId] = useState("");
  const [selectedGridMeetingId, setSelectedGridMeetingId] = useState(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [buildingsError, setBuildingsError] = useState(null);
  const [meetingsError, setMeetingsError] = useState(null);
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

  async function loadMeetings(buildingId) {
    if (buildingId === "0") {
      setMeetings([]);
      setMeetingsError(null);
      return;
    }

    setLoadingMeetings(true);
    setMeetingsError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_meetings", {
        p_building_id: Number(buildingId),
      });

      if (error) {
        throw error;
      }

      setMeetings(data ?? []);
    } catch (loadError) {
      setMeetings([]);
      setMeetingsError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load meetings."
      );
    } finally {
      setLoadingMeetings(false);
    }
  }

  useEffect(() => {
    loadBuildings();
  }, []);

  function handleBuildingChange(event) {
    const buildingId = event.target.value;
    setSelectedBuildingId(buildingId);
    setMeetingId("");
    setSelectedGridMeetingId(null);
    setSaveError(null);
    setSaveMessage(null);
    loadMeetings(buildingId);
  }

  function handleClear() {
    setSelectedBuildingId("0");
    setMeetingId("");
    setSelectedGridMeetingId(null);
    setMeetingDate("");
    setMeetings([]);
    setMeetingsError(null);
    setSaveError(null);
    setSaveMessage(null);
  }

  function handleMeetingSelect(meetingRow) {
    setSaveError(null);
    setSaveMessage(null);
    const buildingId = getMeetingField(meetingRow, "building_id") || "0";

    setSelectedGridMeetingId(meetingRow.id);
    setMeetingId(getMeetingField(meetingRow, "id"));
    setSelectedBuildingId(buildingId);
    setMeetingDate(formatDateForInput(getMeetingField(meetingRow, "meeting_date")));
    loadMeetings(buildingId);
  }

  async function handleSave() {
    setSaveError(null);
    setSaveMessage(null);

    if (selectedBuildingId === "0") {
      setSaveError("Please select a building.");
      return;
    }

    if (!meetingDate) {
      setSaveError("Please select a meeting date.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pi_meetings", {
        p_meeting_name: "",
        p_meeting_date: meetingDate,
        p_building_id: Number(selectedBuildingId),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      setMeetingId("");
      setSelectedGridMeetingId(null);
      setMeetingDate("");
      await loadMeetings(selectedBuildingId);
      setSaveMessage("Meeting saved successfully.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChange() {
    setSaveError(null);
    setSaveMessage(null);

    if (!meetingId) {
      setSaveError("Please select a meeting from the grid.");
      return;
    }

    if (selectedBuildingId === "0") {
      setSaveError("Please select a building.");
      return;
    }

    if (!meetingDate) {
      setSaveError("Please select a meeting date.");
      return;
    }

    setUpdating(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pu_meetings", {
        p_id: Number(meetingId),
        p_meeting_name: "",
        p_meeting_date: meetingDate,
        p_building_id: Number(selectedBuildingId),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      setMeetingId("");
      setSelectedGridMeetingId(null);
      setMeetingDate("");
      await loadMeetings(selectedBuildingId);
      setSaveMessage("Meeting updated successfully.");
    } finally {
      setUpdating(false);
    }
  }

  const isEditing = selectedGridMeetingId !== null;
  const isBusy = saving || updating;

  return (
    <div className="space-y-4">
      <input
        id="meetingId"
        name="meetingId"
        type="text"
        readOnly
        value={meetingId}
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
          htmlFor="meetingDate"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Meeting Date
        </label>
        <input
          id="meetingDate"
          name="meetingDate"
          type="date"
          value={meetingDate}
          onChange={(event) => setMeetingDate(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="grid grid-cols-3 items-center gap-4">
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

      <MeetingsGrid
        meetings={meetings}
        loading={loadingMeetings}
        selectedMeetingId={selectedGridMeetingId}
        onSelectMeeting={handleMeetingSelect}
      />

      {meetingsError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {meetingsError}
        </p>
      ) : null}
    </div>
  );
}
