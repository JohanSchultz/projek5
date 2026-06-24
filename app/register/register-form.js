"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const listboxClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const readonlyTopicClassName =
  "min-w-0 flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-50";

function getRowField(row, fieldName) {
  const key = Object.keys(row).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? String(row[key] ?? "") : "";
}

export default function RegisterForm() {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("0");
  const [idNumber, setIdNumber] = useState("");
  const [voterId, setVoterId] = useState("");
  const [units, setUnits] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState("0");
  const [topics, setTopics] = useState([]);
  const [topicVotes, setTopicVotes] = useState({});
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [buildingsError, setBuildingsError] = useState(null);
  const [meetingsError, setMeetingsError] = useState(null);
  const [topicsError, setTopicsError] = useState(null);
  const [voteError, setVoteError] = useState(null);
  const [voteMessage, setVoteMessage] = useState(null);
  const [votingTopicId, setVotingTopicId] = useState(null);
  const [votedTopicIds, setVotedTopicIds] = useState({});

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
    if (!buildingId || buildingId === "0") {
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
      setTopicVotes({});
      setVotedTopicIds({});
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
      setTopicVotes({});
      setVotedTopicIds({});
    } catch (loadError) {
      setTopics([]);
      setTopicVotes({});
      setVotedTopicIds({});
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
    setTopics([]);
    setTopicVotes({});
    setVotedTopicIds({});
    setTopicsError(null);
    setVoteError(null);
    setVoteMessage(null);
    loadMeetings(buildingId);
  }

  function handleMeetingChange(event) {
    const meetingId = event.target.value;
    setSelectedMeetingId(meetingId);
    setVoteError(null);
    setVoteMessage(null);
    loadTopics(meetingId);
  }

  function handleTopicVoteChange(topicId, vote) {
    setTopicVotes((current) => ({
      ...current,
      [topicId]: vote,
    }));
  }

  async function handleVote(topicId) {
    const vote = topicVotes[topicId];

    if (!vote) {
      return;
    }

    if (!voterId) {
      setVoteError("Voter ID is missing.");
      setVoteMessage(null);
      return;
    }

    setVoteError(null);
    setVoteMessage(null);
    setVotingTopicId(topicId);

    try {
      const supabase = createClient();
      const { data: isLocked, error: lockCheckError } = await supabase.rpc(
        "pr_topics_is_locked",
        {
          p_id: Number(topicId),
        }
      );

      if (lockCheckError) {
        throw lockCheckError;
      }

      const topicIsLocked =
        isLocked === true ||
        isLocked === "true" ||
        isLocked === 1 ||
        isLocked === "1";

      if (topicIsLocked) {
        setVoteError("This Topic has been Locked");
        return;
      }

      const { error } = await supabase.rpc("piu_vote", {
        p_yes: vote === "yes",
        p_topic_id: Number(topicId),
        p_voter_id: Number(voterId),
      });

      if (error) {
        throw error;
      }

      setVoteMessage("Vote recorded successfully.");
      setVotedTopicIds((current) => ({
        ...current,
        [topicId]: true,
      }));
    } catch (voteSubmitError) {
      setVoteError(
        voteSubmitError instanceof Error
          ? voteSubmitError.message
          : "Could not record vote."
      );
    } finally {
      setVotingTopicId(null);
    }
  }

  async function handleLookup() {
    setSearchError(null);
    setMeetingsError(null);
    setHasSearched(false);
    setVoterId("");
    setUnits([]);
    setMeetings([]);
    setSelectedMeetingId("0");
    setTopics([]);
    setTopicVotes({});
    setVotedTopicIds({});
    setTopicsError(null);
    setVoteError(null);
    setVoteMessage(null);

    if (selectedBuildingId === "0") {
      setSearchError("Please select a building.");
      return;
    }

    setLoadingUnits(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_units_by_idno", {
        p_idnumber: idNumber,
        p_building_id: Number(selectedBuildingId),
      });

      if (error) {
        throw error;
      }

      const unitRows = data ?? [];
      setUnits(unitRows);
      setHasSearched(true);

      if (unitRows.length > 0) {
        setVoterId(getRowField(unitRows[0], "voter_id"));
        await loadMeetings(selectedBuildingId);
      } else {
        setVoterId("");
      }
    } catch (lookupError) {
      setVoterId("");
      setUnits([]);
      setMeetings([]);
      setTopics([]);
      setTopicVotes({});
      setVotedTopicIds({});
      setHasSearched(true);
      setSearchError(
        lookupError instanceof Error
          ? lookupError.message
          : "Could not load units."
      );
    } finally {
      setLoadingUnits(false);
    }
  }

  return (
    <div className="space-y-4">
      <input
        id="voter_id"
        name="voter_id"
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
          htmlFor="idNumber"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Please Enter Your ID Number :
        </label>
        <div className="flex items-center gap-3">
          <input
            id="idNumber"
            name="idNumber"
            type="text"
            value={idNumber}
            onChange={(event) => setIdNumber(event.target.value)}
            className={inputClassName}
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={loadingUnits || loadingMeetings}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            {">>"}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="units"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Units
        </label>
        {loadingUnits ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading units...
          </p>
        ) : hasSearched && units.length === 0 && !searchError ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No Units Are Associated With The Given ID Number.
          </p>
        ) : units.length > 0 ? (
          <select
            id="units"
            name="units"
            size={6}
            className={listboxClassName}
          >
            {units.map((unitRow, index) => (
              <option key={unitRow.id ?? index} value={getRowField(unitRow, "name")}>
                {getRowField(unitRow, "name")}
              </option>
            ))}
          </select>
        ) : null}
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
              {getRowField(meeting, "meeting_date")}
            </option>
          ))}
        </select>
      </div>

      {loadingTopics ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Loading topics...
        </p>
      ) : null}

      {topics.length > 0 ? (
        <div className="space-y-4">
          {topics.map((topicRow, index) => {
            const topicId = getRowField(topicRow, "id") || String(index);
            const topicText = getRowField(topicRow, "topic_text");
            const selectedVote = topicVotes[topicId] ?? "";
            const hasVoted = Boolean(votedTopicIds[topicId]);
            const isVoting = votingTopicId === topicId;

            return (
              <fieldset
                key={topicId}
                data-topic-id={topicId}
                className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <input
                  id={`topicId-${topicId}`}
                  name={`topicId-${topicId}`}
                  type="text"
                  readOnly
                  value={topicId}
                  hidden
                />
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    id={`topicText-${topicId}`}
                    name={`topicText-${topicId}`}
                    type="text"
                    readOnly
                    value={topicText}
                    className={readonlyTopicClassName}
                  />
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <input
                        type="radio"
                        name={`vote-${topicId}`}
                        value="yes"
                        checked={selectedVote === "yes"}
                        onChange={() => handleTopicVoteChange(topicId, "yes")}
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <input
                        type="radio"
                        name={`vote-${topicId}`}
                        value="no"
                        checked={selectedVote === "no"}
                        onChange={() => handleTopicVoteChange(topicId, "no")}
                      />
                      No
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVote(topicId)}
                    disabled={!selectedVote || isVoting}
                    className={
                      hasVoted
                        ? "inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-blue-300 bg-blue-200 px-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                        : "inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-red-300 bg-red-100 px-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-300 dark:bg-red-100 dark:text-zinc-900 dark:hover:bg-red-200"
                    }
                  >
                    {isVoting ? "Voting..." : hasVoted ? "Voted" : "Not Voted"}
                  </button>
                </div>
              </fieldset>
            );
          })}
        </div>
      ) : null}

      {searchError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {searchError}
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

      {topicsError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {topicsError}
        </p>
      ) : null}

      {voteMessage ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {voteMessage}
        </p>
      ) : null}

      {voteError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {voteError}
        </p>
      ) : null}
    </div>
  );
}
