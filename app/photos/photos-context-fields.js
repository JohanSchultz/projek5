"use client";

import { useEffect, useState } from "react";

const readonlyFieldClassName =
  "w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

export default function PhotosContextFields() {
  const [technician, setTechnician] = useState("");
  const [note, setNote] = useState("");
  const [noteId, setNoteId] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("notesPhotosContext");

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setTechnician(parsed.technician ?? "");
      setNote(parsed.note ?? "");
      setNoteId(parsed.noteId ?? "");
    } catch {
      // Ignore invalid stored context.
    }
  }, []);

  return (
    <div className="mb-6 space-y-4">
      <input
        id="note_id"
        name="note_id"
        type="text"
        readOnly
        value={noteId}
        hidden
      />

      <div>
        <label
          htmlFor="technician"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Technician
        </label>
        <input
          id="technician"
          name="technician"
          type="text"
          readOnly
          disabled
          value={technician}
          className={readonlyFieldClassName}
        />
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
          readOnly
          disabled
          value={note}
          className={`${readonlyFieldClassName} min-h-40 resize-none`}
        />
      </div>
    </div>
  );
}
