"use client";

import NotesGrid from "./notes-grid";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const readonlyBaseClassName =
  "rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

const readonlyFieldClassName = `${readonlyBaseClassName} w-full`;
const readonlySmallFieldClassName = `${readonlyBaseClassName} w-32`;

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function normalizeName(value) {
  return (value ?? "").trim();
}

function formatReportDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

export default function NotesForm({ technicians }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [note, setNote] = useState("");
  const [noteId, setNoteId] = useState("");
  const [selectedGridNoteId, setSelectedGridNoteId] = useState(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("0");
  const [context, setContext] = useState(null);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState([]);
  const [saveError, setSaveError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState(null);

  async function loadNotes(problemId) {
    setLoadingNotes(true);
    setNotesError(null);

    try {
      const supabase = createClient();
      const { data, error: loadNotesError } = await supabase.rpc(
        "pr_note_by_problem_id",
        { p_problem_id: Number(problemId) }
      );

      if (loadNotesError) {
        throw loadNotesError;
      }

      setNotes(data ?? []);
    } catch (loadError) {
      setNotes([]);
      setNotesError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load notes for this problem."
      );
    } finally {
      setLoadingNotes(false);
    }
  }

  useEffect(() => {
    const stored = sessionStorage.getItem("issuesNotesContext");
    const problemId = searchParams.get("problemId");

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setContext(parsed);
        setSelectedTechnicianId(parsed.technicianId ?? "0");
        loadNotes(parsed.problemId);
        return;
      } catch {
        setError("Could not read problem details from the Issues page.");
        return;
      }
    }

    if (!problemId) {
      setError("No problem was selected on the Issues page.");
      return;
    }

    setError("Problem details were not found. Return to Issues and select Notes again.");
  }, [searchParams]);

  async function handleSave() {
    setSaveError(null);
    setSaveMessage(null);

    if (!context?.problemId) {
      setSaveError("No problem was selected on the Issues page.");
      return;
    }

    if (selectedTechnicianId === "0") {
      setSaveError("Please select a technician.");
      return;
    }

    if (!note.trim()) {
      setSaveError("Please enter a note.");
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const { error: saveNoteError } = await supabase.rpc("pi_note", {
      p_problem_id: Number(context.problemId),
      note,
      p_technician_id: Number(selectedTechnicianId),
    });

    setSaving(false);

    if (saveNoteError) {
      setSaveError(saveNoteError.message);
      return;
    }

    resetEditableFields();
    await loadNotes(context.problemId);
    setSaveMessage("Note saved successfully.");
  }

  function resetEditableFields() {
    setNote("");
    setNoteId("");
    setSelectedGridNoteId(null);
    setSelectedTechnicianId(context?.technicianId ?? "0");
  }

  function resetAfterUpdate() {
    setNote("");
    setNoteId("");
    setSelectedGridNoteId(null);
    setSelectedTechnicianId("0");
  }

  function handleNoteSelect(noteRow) {
    setSaveError(null);
    setSaveMessage(null);
    setSelectedGridNoteId(noteRow.id);
    setNoteId(String(noteRow.id));
    setNote(noteRow.note ?? "");

    const technician = technicians.find(
      (item) => normalizeName(item.name) === normalizeName(noteRow.name)
    );

    setSelectedTechnicianId(technician ? String(technician.id) : "0");
  }

  async function handleUpdate() {
    setSaveError(null);
    setSaveMessage(null);

    if (!noteId) {
      setSaveError("Please select a note from the grid.");
      return;
    }

    if (selectedTechnicianId === "0") {
      setSaveError("Please select a technician.");
      return;
    }

    if (!note.trim()) {
      setSaveError("Please enter a note.");
      return;
    }

    setUpdating(true);

    const supabase = createClient();
    const { error: updateNoteError } = await supabase.rpc("pu_note", {
      p_id: Number(noteId),
      p_techncician_id: Number(selectedTechnicianId),
      p_note: note,
    });

    setUpdating(false);

    if (updateNoteError) {
      setSaveError(updateNoteError.message);
      return;
    }

    resetAfterUpdate();
    await loadNotes(context.problemId);
    setSaveMessage("Note updated successfully.");
  }

  function handlePhotos() {
    const technician = technicians.find(
      (item) => String(item.id) === selectedTechnicianId
    );

    sessionStorage.setItem(
      "notesPhotosContext",
      JSON.stringify({
        technician: technician?.name ?? "",
        note,
        noteId,
      })
    );

    router.push("/photos");
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {error}
      </p>
    );
  }

  if (!context) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading problem details...
      </p>
    );
  }

  const isEditing = Boolean(noteId);

  return (
    <div className="space-y-4">
      <input
        id="note_id"
        name="note_id"
        type="text"
        readOnly
        value={noteId}
        hidden
      />

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Building
          </label>
          <input
            type="text"
            readOnly
            value={context.building ?? ""}
            className={readonlySmallFieldClassName}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Area
          </label>
          <input
            type="text"
            readOnly
            value={context.area ?? ""}
            className={readonlySmallFieldClassName}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Technician
          </label>
          <input
            type="text"
            readOnly
            value={context.technician ?? ""}
            className={readonlySmallFieldClassName}
          />
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Estimated Hours
          </label>
          <input
            type="text"
            readOnly
            value={context.estimatedHours ?? ""}
            className={readonlySmallFieldClassName}
          />
        </div>

        <div className="text-right">
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Report Date
          </label>
          <input
            type="text"
            readOnly
            value={formatReportDate(context.reportDate)}
            className={`${readonlyFieldClassName} w-44`}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Comments
        </label>
        <textarea
          readOnly
          rows={6}
          value={context.comments ?? ""}
          className={`${readonlyFieldClassName} min-h-40 resize-none`}
        />
      </div>

      <hr className="border-zinc-300 dark:border-zinc-700" />

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
          onChange={(event) => setSelectedTechnicianId(event.target.value)}
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

      <div>
        <label
          htmlFor="note"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Note
        </label>
        <textarea
          id="note"
          name="note"
          rows={6}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={`${inputClassName} min-h-40 w-full resize-y`}
        />
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
            onClick={handlePhotos}
            disabled={saving || updating || !isEditing}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-yellow-500/40 bg-yellow-500/50 px-5 text-sm font-medium text-yellow-950 transition-colors hover:bg-yellow-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-yellow-400/30 dark:bg-yellow-500/30 dark:text-yellow-50 dark:hover:bg-yellow-500/50"
          >
            Photos
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

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Notes
        </h2>
        <NotesGrid
          notes={notes}
          loading={loadingNotes}
          selectedNoteId={selectedGridNoteId}
          onSelectNote={handleNoteSelect}
        />
        {notesError ? (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {notesError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
