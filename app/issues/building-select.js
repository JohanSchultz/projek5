"use client";

import ActiveProblemsGrid from "./active-problems-grid";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeName(value) {
  return (value ?? "").trim();
}

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export default function BuildingSelect({ buildings, technicians, activeProblems }) {
  const router = useRouter();
  const [selectedBuildingId, setSelectedBuildingId] = useState("0");
  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState("0");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("0");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [estimatedResolveDate, setEstimatedResolveDate] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [comments, setComments] = useState("");
  const [problemId, setProblemId] = useState("");
  const [selectedGridProblemId, setSelectedGridProblemId] = useState(null);
  const [problems, setProblems] = useState(activeProblems);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [areasError, setAreasError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    setProblems(activeProblems);
  }, [activeProblems]);

  async function loadAreas(buildingId) {
    setLoadingAreas(true);
    setAreasError(null);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("pr_areas", {
      p_building_id: Number(buildingId),
    });

    setLoadingAreas(false);

    if (error) {
      setAreasError(error.message);
      throw error;
    }

    const sortedAreas = [...(data ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );

    setAreas(sortedAreas);
    return sortedAreas;
  }

  async function handleBuildingChange(event) {
    const buildingId = event.target.value;
    setSelectedBuildingId(buildingId);
    setSelectedAreaId("0");
    setAreas([]);
    setAreasError(null);

    if (buildingId === "0") {
      return;
    }

    try {
      await loadAreas(buildingId);
    } catch {
      // Error message is already set in loadAreas.
    }
  }

  function handleAreaChange(event) {
    setSelectedAreaId(event.target.value);
  }

  function handleTechnicianChange(event) {
    setSelectedTechnicianId(event.target.value);
  }

  function resetForm() {
    setSelectedBuildingId("0");
    setAreas([]);
    setSelectedAreaId("0");
    setSelectedTechnicianId("0");
    setEstimatedHours("");
    setEstimatedResolveDate("");
    setReportDate("");
    setComments("");
    setProblemId("");
    setSelectedGridProblemId(null);
    setAreasError(null);
  }

  async function handleProblemSelect(id) {
    setSaveError(null);
    setSaveMessage(null);
    setSelectedGridProblemId(id);
    setLoadingProblem(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_problem_by_id", {
        p_id: id,
      });

      if (error) {
        throw error;
      }

      const problem = Array.isArray(data) ? data[0] : data;

      if (!problem) {
        throw new Error("Problem details could not be found.");
      }

      const building = buildings.find(
        (item) =>
          normalizeName(item.name) === normalizeName(problem.building)
      );
      const technician = technicians.find(
        (item) =>
          normalizeName(item.name) === normalizeName(problem.technician)
      );

      if (!building) {
        throw new Error("Building could not be matched in the dropdown list.");
      }

      setSelectedBuildingId(String(building.id));

      const loadedAreas = await loadAreas(building.id);
      const area = loadedAreas.find(
        (item) => normalizeName(item.name) === normalizeName(problem.area)
      );

      setSelectedAreaId(area ? String(area.id) : "0");
      setSelectedTechnicianId(technician ? String(technician.id) : "0");
      setEstimatedHours(
        problem.estimated_hours == null ? "" : String(problem.estimated_hours)
      );
      setEstimatedResolveDate(problem.estimated_resolve_date ?? "");
      setReportDate(problem.report_date ?? "");
      setComments(problem.comments ?? "");
      setProblemId(String(problem.id));
    } catch (selectError) {
      setSaveError(
        selectError instanceof Error
          ? selectError.message
          : "Could not load the selected problem."
      );
    } finally {
      setLoadingProblem(false);
    }
  }

  useEffect(() => {
    const reloadProblemId = sessionStorage.getItem("issuesReloadProblemId");

    if (!reloadProblemId) {
      return;
    }

    sessionStorage.removeItem("issuesReloadProblemId");
    handleProblemSelect(Number(reloadProblemId));
  }, []);

  async function refreshProblems() {
    setLoadingProblems(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_problems_active");

      if (error) {
        throw error;
      }

      setProblems(data ?? []);
    } finally {
      setLoadingProblems(false);
    }
  }

  function getProblemPayload() {
    return {
      p_building_id: Number(selectedBuildingId),
      p_unit_id: Number(selectedAreaId),
      p_report_date: getCurrentDate(),
      p_estimated_resolve_date: estimatedResolveDate || null,
      p_actual_resolve_date: null,
      p_estimated_hours:
        estimatedHours === "" ? null : Number(estimatedHours),
      p_actual_hours: null,
      p_status_id: 1,
      p_technician_id: Number(selectedTechnicianId),
      p_comments: comments,
    };
  }

  function validateFormFields(requireProblemId = false) {
    if (requireProblemId && !problemId) {
      return "Please select a problem from the grid to update.";
    }

    if (selectedBuildingId === "0") {
      return "Please select a building.";
    }

    if (selectedAreaId === "0") {
      return "Please select an area.";
    }

    if (selectedTechnicianId === "0") {
      return "Please select a technician.";
    }

    return null;
  }

  async function handleSave() {
    setSaveError(null);
    setSaveMessage(null);

    const validationError = validateFormFields();
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.rpc("pi_problem", getProblemPayload());

    if (error) {
      setSaving(false);
      setSaveError(error.message);
      return;
    }

    try {
      await refreshProblems();
      router.refresh();
      resetForm();
      setSaveMessage("Problem saved successfully.");
    } catch (refreshError) {
      setSaveError(
        refreshError instanceof Error
          ? `Saved, but could not refresh the grid: ${refreshError.message}`
          : "Saved, but could not refresh the grid."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleNotes() {
    const building = buildings.find(
      (item) => String(item.id) === selectedBuildingId
    );
    const area = areas.find((item) => String(item.id) === selectedAreaId);
    const technician = technicians.find(
      (item) => String(item.id) === selectedTechnicianId
    );

    sessionStorage.setItem(
      "issuesNotesContext",
      JSON.stringify({
        problemId,
        building: building?.name ?? "",
        area: area?.name ?? "",
        technician: technician?.name ?? "",
        technicianId: selectedTechnicianId,
        estimatedHours,
        reportDate,
        comments,
      })
    );

    router.push(`/notes?problemId=${problemId}`);
  }

  async function handleUpdate() {
    setSaveError(null);
    setSaveMessage(null);

    const validationError = validateFormFields(true);
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setUpdating(true);

    const supabase = createClient();
    const { error } = await supabase.rpc("pu_problem", {
      p_id: Number(problemId),
      ...getProblemPayload(),
    });

    if (error) {
      setUpdating(false);
      setSaveError(error.message);
      return;
    }

    try {
      await refreshProblems();
      router.refresh();
      resetForm();
      setSaveMessage("Problem updated successfully.");
    } catch (refreshError) {
      setSaveError(
        refreshError instanceof Error
          ? `Updated, but could not refresh the grid: ${refreshError.message}`
          : "Updated, but could not refresh the grid."
      );
    } finally {
      setUpdating(false);
    }
  }

  const isEditing = Boolean(problemId);

  return (
    <div className="space-y-4">
      <input id="problemId" name="problemId" type="text" readOnly value={problemId} hidden />

      <div>
        <label
          htmlFor="building"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Building
        </label>
        <select
          id="building"
          name="buildingId"
          value={selectedBuildingId}
          onChange={handleBuildingChange}
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
          htmlFor="area"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Areas
        </label>
        <select
          id="area"
          name="areaId"
          value={selectedAreaId}
          onChange={handleAreaChange}
          disabled={selectedBuildingId === "0" || loadingAreas}
          className={selectClassName}
        >
          <option value="0">- SELECT -</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        {loadingAreas ? (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Loading areas...
          </p>
        ) : null}
        {areasError ? (
          <p className="mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {areasError}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="technician"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Technicians
        </label>
        <select
          id="technician"
          name="technicianId"
          value={selectedTechnicianId}
          onChange={handleTechnicianChange}
          className={selectClassName}
        >
          <option value="0">- SELECT -</option>
          {technicians.map((technician) => (
            <option key={technician.id} value={technician.id}>
              {technician.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <label
            htmlFor="estimatedHours"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Estimated Hours
          </label>
          <input
            id="estimatedHours"
            name="estimatedHours"
            type="number"
            min="0"
            step="0.25"
            value={estimatedHours}
            onChange={(event) => setEstimatedHours(event.target.value)}
            className={`${inputClassName} w-32`}
          />
        </div>

        <div className="text-right">
          <label
            htmlFor="estimatedResolveDate"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Estimated Resolve Date
          </label>
          <input
            id="estimatedResolveDate"
            name="estimatedResolveDate"
            type="date"
            value={estimatedResolveDate}
            onChange={(event) => setEstimatedResolveDate(event.target.value)}
            className={`${inputClassName} w-44`}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="comments"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Comments
        </label>
        <textarea
          id="comments"
          name="comments"
          rows={6}
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          className={`${inputClassName} min-h-40 w-full resize-y`}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Active Problems
        </h2>
        <ActiveProblemsGrid
          problems={problems}
          loading={loadingProblems}
          selectedProblemId={selectedGridProblemId}
          onSelectProblem={handleProblemSelect}
        />
        {loadingProblem ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Loading problem details...
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-3 items-center">
        <div className="justify-self-start">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || updating || isEditing}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/50 px-5 text-sm font-medium text-blue-950 transition-colors hover:bg-blue-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-400/30 dark:bg-blue-500/30 dark:text-blue-50 dark:hover:bg-blue-500/50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="justify-self-center">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={saving || updating || !isEditing}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/50 px-5 text-sm font-medium text-orange-950 transition-colors hover:bg-orange-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-orange-400/30 dark:bg-orange-500/30 dark:text-orange-50 dark:hover:bg-orange-500/50"
          >
            {updating ? "Updating..." : "Update"}
          </button>
        </div>

        <div className="justify-self-end">
          <button
            type="button"
            onClick={handleNotes}
            disabled={saving || updating || !isEditing}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-yellow-500/40 bg-yellow-500/50 px-5 text-sm font-medium text-yellow-950 transition-colors hover:bg-yellow-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-yellow-400/30 dark:bg-yellow-500/30 dark:text-yellow-50 dark:hover:bg-yellow-500/50"
          >
            Notes
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
    </div>
  );
}
