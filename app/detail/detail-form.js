"use client";

import DetailGrid from "./detail-grid";
import QuorumUnitsGrid, {
  normalizeQuorumUnitNames,
} from "./quorum-units-grid";
import { exportVoteDetailsToExcel } from "./export-vote-details-excel";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const actionButtonClassName =
  "inline-flex h-11 items-center justify-center rounded-lg border border-green-300 bg-green-100 px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-60";

function getMeetingField(meetingRow, fieldName) {
  const key = Object.keys(meetingRow).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? String(meetingRow[key] ?? "") : "";
}

function formatQuorumValue(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return numericValue.toFixed(4);
}

function getRegisteredWeightClassName(value) {
  if (!value) {
    return inputClassName;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return inputClassName;
  }

  return numericValue < 0.333
    ? `${inputClassName} text-red-600 dark:text-red-400`
    : `${inputClassName} text-blue-600 dark:text-blue-400`;
}

export default function DetailForm() {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("0");
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState("0");
  const [registeredWeight, setRegisteredWeight] = useState("");
  const [quorumUnitNames, setQuorumUnitNames] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [loadingQuorum, setLoadingQuorum] = useState(false);
  const [loadingQuorumUnits, setLoadingQuorumUnits] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [buildingsError, setBuildingsError] = useState(null);
  const [meetingsError, setMeetingsError] = useState(null);
  const [quorumError, setQuorumError] = useState(null);
  const [quorumUnitsError, setQuorumUnitsError] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [hasLoadedReport, setHasLoadedReport] = useState(false);
  const [exporting, setExporting] = useState(false);

  function getSelectedBuildingName() {
    const selectedBuilding = buildings.find(
      (building) => String(building.id) === selectedBuildingId
    );

    return selectedBuilding?.name ?? "";
  }

  function getSelectedMeetingLabel() {
    const selectedMeeting = meetings.find(
      (meeting) => String(meeting.id) === selectedMeetingId
    );

    return selectedMeeting
      ? getMeetingField(selectedMeeting, "meeting_date")
      : "";
  }

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

  async function loadRegisteredWeight(meetingId) {
    if (meetingId === "0") {
      setRegisteredWeight("");
      setQuorumError(null);
      return;
    }

    setLoadingQuorum(true);
    setQuorumError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_rpt_quorum", {
        p_meeting_id: Number(meetingId),
      });

      if (error) {
        throw error;
      }

      setRegisteredWeight(formatQuorumValue(data));
    } catch (loadError) {
      setRegisteredWeight("");
      setQuorumError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load registered weight."
      );
    } finally {
      setLoadingQuorum(false);
    }
  }

  async function loadQuorumUnits(meetingId) {
    if (meetingId === "0") {
      setQuorumUnitNames([]);
      setQuorumUnitsError(null);
      return;
    }

    setLoadingQuorumUnits(true);
    setQuorumUnitsError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_rpt_quorum_units", {
        p_meeting_id: Number(meetingId),
      });

      if (error) {
        throw error;
      }

      setQuorumUnitNames(normalizeQuorumUnitNames(data));
    } catch (loadError) {
      setQuorumUnitNames([]);
      setQuorumUnitsError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load quorum units."
      );
    } finally {
      setLoadingQuorumUnits(false);
    }
  }

  useEffect(() => {
    loadBuildings();
  }, []);

  function handleBuildingChange(event) {
    const buildingId = event.target.value;
    setSelectedBuildingId(buildingId);
    setSelectedMeetingId("0");
    setRegisteredWeight("");
    setQuorumError(null);
    setQuorumUnitNames([]);
    setQuorumUnitsError(null);
    setReportRows([]);
    setReportError(null);
    setHasLoadedReport(false);
    loadMeetings(buildingId);
  }

  async function handleMeetingChange(event) {
    const meetingId = event.target.value;
    setSelectedMeetingId(meetingId);
    setReportRows([]);
    setReportError(null);
    setHasLoadedReport(false);
    await Promise.all([
      loadRegisteredWeight(meetingId),
      loadQuorumUnits(meetingId),
    ]);
  }

  async function handleShowReport() {
    if (selectedMeetingId === "0") {
      setReportError("Please select a meeting.");
      return;
    }

    setLoadingReport(true);
    setReportError(null);
    setReportRows([]);
    setHasLoadedReport(false);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_rpt_vote_details", {
        p_meeting_id: Number(selectedMeetingId),
      });

      if (error) {
        throw error;
      }

      setReportRows(data ?? []);
      setHasLoadedReport(true);
    } catch (loadError) {
      setReportRows([]);
      setHasLoadedReport(true);
      setReportError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load vote details report."
      );
    } finally {
      setLoadingReport(false);
    }
  }

  async function handleExportToExcel() {
    if (!reportRows.length) {
      setReportError("Load a report before exporting to Excel.");
      return;
    }

    setExporting(true);

    try {
      await exportVoteDetailsToExcel({
        reportRows,
        buildingName: getSelectedBuildingName(),
        meetingLabel: getSelectedMeetingLabel(),
        selectedMeetingId,
      });
      setReportError(null);
    } catch (exportError) {
      setReportError(
        exportError instanceof Error
          ? exportError.message
          : "Could not export the report to Excel."
      );
    } finally {
      setExporting(false);
    }
  }

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

      <div>
        <label
          htmlFor="registeredWeight"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Registered Weight
        </label>
        <input
          id="registeredWeight"
          name="registeredWeight"
          type="text"
          readOnly
          value={loadingQuorum ? "Loading..." : registeredWeight}
          className={
            loadingQuorum
              ? inputClassName
              : getRegisteredWeightClassName(registeredWeight)
          }
        />
      </div>

      {selectedMeetingId !== "0" ? (
        <QuorumUnitsGrid
          unitNames={quorumUnitNames}
          loading={loadingQuorumUnits}
        />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleShowReport}
          disabled={loadingReport || selectedMeetingId === "0"}
          className={actionButtonClassName}
        >
          {loadingReport ? "Loading..." : "Show Report"}
        </button>
        <button
          type="button"
          onClick={handleExportToExcel}
          disabled={!reportRows.length || exporting}
          className={actionButtonClassName}
        >
          {exporting ? "Exporting..." : "Export to Excel"}
        </button>
      </div>

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

      {quorumError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {quorumError}
        </p>
      ) : null}

      {quorumUnitsError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {quorumUnitsError}
        </p>
      ) : null}

      {reportError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {reportError}
        </p>
      ) : null}

      {loadingReport || hasLoadedReport ? (
        <DetailGrid rows={reportRows} loading={loadingReport} />
      ) : null}
    </div>
  );
}
