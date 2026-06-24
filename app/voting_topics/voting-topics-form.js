"use client";

import VotingTopicsGrid from "./voting-topics-grid";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const textareaClassName =
  "w-full min-h-40 resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function getMeetingField(meetingRow, fieldName) {
  const key = Object.keys(meetingRow).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? String(meetingRow[key] ?? "") : "";
}

function getTopicField(topicRow, fieldName) {
  const key = Object.keys(topicRow).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? String(topicRow[key] ?? "") : "";
}

export default function VotingTopicsForm() {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("0");
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState("0");
  const [topicId, setTopicId] = useState("");
  const [selectedGridTopicId, setSelectedGridTopicId] = useState(null);
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [buildingsError, setBuildingsError] = useState(null);
  const [meetingsError, setMeetingsError] = useState(null);
  const [topicsError, setTopicsError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lockingTopicId, setLockingTopicId] = useState(null);

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

  async function loadTopics(meetingId) {
    if (meetingId === "0") {
      setTopics([]);
      setTopicsError(null);
      return;
    }

    setLoadingTopics(true);
    setTopicsError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_topics", {
        p_meeting_id: Number(meetingId),
      });

      if (error) {
        throw error;
      }

      setTopics(data ?? []);
    } catch (loadError) {
      setTopics([]);
      setTopicsError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load topics."
      );
    } finally {
      setLoadingTopics(false);
    }
  }

  useEffect(() => {
    loadBuildings();
  }, []);

  function handleBuildingChange(event) {
    const buildingId = event.target.value;
    setSelectedBuildingId(buildingId);
    setSelectedMeetingId("0");
    setTopicId("");
    setSelectedGridTopicId(null);
    setTopic("");
    setTopics([]);
    setTopicsError(null);
    setSaveError(null);
    setSaveMessage(null);
    loadMeetings(buildingId);
  }

  function handleMeetingChange(event) {
    const meetingId = event.target.value;
    setSelectedMeetingId(meetingId);
    setTopicId("");
    setSelectedGridTopicId(null);
    setTopic("");
    setSaveError(null);
    setSaveMessage(null);
    loadTopics(meetingId);
  }

  function handleClear() {
    setTopicId("");
    setSelectedGridTopicId(null);
    setTopic("");
    setSaveError(null);
    setSaveMessage(null);
  }

  function handleTopicSelect(topicRow) {
    setSaveError(null);
    setSaveMessage(null);
    setSelectedGridTopicId(topicRow.id);
    setTopicId(getTopicField(topicRow, "id"));
    setTopic(getTopicField(topicRow, "topic_text"));
  }

  async function handleToggleLock(topicRow, nextIsLocked) {
    const topicRowId = getTopicField(topicRow, "id");

    if (!topicRowId || selectedMeetingId === "0") {
      return;
    }

    setSaveError(null);
    setSaveMessage(null);
    setLockingTopicId(topicRow.id);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pu_topics_lock", {
        p_id: Number(topicRowId),
        p_is_locked: nextIsLocked,
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      await loadTopics(selectedMeetingId);
    } finally {
      setLockingTopicId(null);
    }
  }

  async function handleSave() {
    setSaveError(null);
    setSaveMessage(null);

    if (selectedMeetingId === "0") {
      setSaveError("Please select a meeting.");
      return;
    }

    if (!topic.trim()) {
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pi_topics", {
        p_meeting_id: Number(selectedMeetingId),
        p_topic_text: topic.trim(),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      setTopicId("");
      setSelectedGridTopicId(null);
      setTopic("");
      await loadTopics(selectedMeetingId);
      setSaveMessage("Topic saved successfully.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChange() {
    setSaveError(null);
    setSaveMessage(null);

    if (!topicId) {
      setSaveError("Please select a topic from the grid.");
      return;
    }

    if (selectedMeetingId === "0") {
      setSaveError("Please select a meeting.");
      return;
    }

    if (!topic.trim()) {
      setSaveError("Please enter a topic.");
      return;
    }

    setUpdating(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pu_topics", {
        p_id: Number(topicId),
        p_meeting_id: Number(selectedMeetingId),
        p_topic_text: topic.trim(),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      setTopicId("");
      setSelectedGridTopicId(null);
      setTopic("");
      await loadTopics(selectedMeetingId);
      setSaveMessage("Topic updated successfully.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    setSaveError(null);
    setSaveMessage(null);

    if (!topicId) {
      setSaveError("Please select a topic from the grid.");
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("pd_topics", {
        p_id: Number(topicId),
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      setTopicId("");
      setSelectedGridTopicId(null);
      setTopic("");
      await loadTopics(selectedMeetingId);
      setSaveMessage("Topic deleted successfully.");
    } finally {
      setDeleting(false);
    }
  }

  const isEditing = selectedGridTopicId !== null;
  const isBusy = saving || updating || deleting || lockingTopicId !== null;

  return (
    <div className="space-y-4">
      <input
        id="topicId"
        name="topicId"
        type="text"
        readOnly
        value={topicId}
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
          htmlFor="meeting"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Meeting
        </label>
        <select
          id="meeting"
          name="meeting"
          value={selectedMeetingId}
          onChange={handleMeetingChange}
          disabled={loadingMeetings || selectedBuildingId === "0"}
          className={selectClassName}
        >
          <option value="0">- SELECT -</option>
          {meetings.map((meeting) => (
            <option key={meeting.id} value={meeting.id}>
              {getMeetingField(meeting, "meeting_date")}
            </option>
          ))}
        </select>
      </div>

      <hr className="border-zinc-300 dark:border-zinc-700" />

      <div>
        <label
          htmlFor="topic"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Topic
        </label>
        <textarea
          id="topic"
          name="topic"
          rows={6}
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className={textareaClassName}
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

      {meetingsError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {meetingsError}
        </p>
      ) : null}

      <VotingTopicsGrid
        topics={topics}
        loading={loadingTopics}
        selectedTopicId={selectedGridTopicId}
        lockingTopicId={lockingTopicId}
        onSelectTopic={handleTopicSelect}
        onToggleLock={handleToggleLock}
      />

      {topicsError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {topicsError}
        </p>
      ) : null}
    </div>
  );
}
