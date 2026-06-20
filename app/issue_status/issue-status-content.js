"use client";

import IssueStatusGrid, { getRowField } from "./issue-status-grid";
import IssueStatusThumbnails from "./issue-status-thumbnails";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const subheadingClassName =
  "text-lg font-semibold text-zinc-900 dark:text-zinc-50";

export default function IssueStatusContent() {
  const [problems, setProblems] = useState([]);
  const [notes, setNotes] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [problemsError, setProblemsError] = useState(null);
  const [notesError, setNotesError] = useState(null);
  const [photosError, setPhotosError] = useState(null);

  async function loadProblems() {
    setLoadingProblems(true);
    setProblemsError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_rpt_problems");

      if (error) {
        throw error;
      }

      setProblems(data ?? []);
    } catch (loadError) {
      setProblems([]);
      setProblemsError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load issues."
      );
    } finally {
      setLoadingProblems(false);
    }
  }

  async function loadNotes(problemId) {
    setLoadingNotes(true);
    setNotesError(null);
    setNotes([]);
    setSelectedNoteId(null);
    setPhotos([]);
    setPhotosError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_rpt_notes", {
        p_problem_id: Number(problemId),
      });

      if (error) {
        throw error;
      }

      setNotes(data ?? []);
    } catch (loadError) {
      setNotes([]);
      setNotesError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load notes."
      );
    } finally {
      setLoadingNotes(false);
    }
  }

  async function loadPhotos(noteId) {
    setLoadingPhotos(true);
    setPhotosError(null);
    setPhotos([]);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("pr_rpt_photos", {
        p_note_id: Number(noteId),
      });

      if (error) {
        throw error;
      }

      const rows = data ?? [];

      const photosWithUrls = await Promise.all(
        rows.map(async (row) => {
          const path = getRowField(row, "path");

          if (!path) {
            return null;
          }

          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from("issues")
              .createSignedUrl(String(path), 3600);

          if (signedUrlError || !signedUrlData?.signedUrl) {
            return null;
          }

          return {
            path: String(path),
            url: signedUrlData.signedUrl,
          };
        })
      );

      setPhotos(photosWithUrls.filter(Boolean));
    } catch (loadError) {
      setPhotos([]);
      setPhotosError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load photos."
      );
    } finally {
      setLoadingPhotos(false);
    }
  }

  useEffect(() => {
    loadProblems();
  }, []);

  function handleProblemSelect(problemRow) {
    const problemId = getRowField(problemRow, "id");

    if (problemId === undefined || problemId === null || problemId === "") {
      return;
    }

    setSelectedProblemId(problemId);
    loadNotes(problemId);
  }

  function handleNoteSelect(noteRow) {
    const noteId = getRowField(noteRow, "id");

    if (noteId === undefined || noteId === null || noteId === "") {
      return;
    }

    setSelectedNoteId(noteId);
    loadPhotos(noteId);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className={subheadingClassName}>Issues</h2>
        <IssueStatusGrid
          rows={problems}
          loading={loadingProblems}
          selectedRowId={selectedProblemId}
          onSelectRow={handleProblemSelect}
          hiddenColumns={["id"]}
          loadingMessage="Loading issues..."
          emptyMessage="No issue status data found."
        />
      </div>

      {problemsError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {problemsError}
        </p>
      ) : null}

      <div className="space-y-3">
        <h2 className={subheadingClassName}>Notes</h2>
        <IssueStatusGrid
          rows={notes}
          loading={loadingNotes}
          selectedRowId={selectedNoteId}
          onSelectRow={handleNoteSelect}
          hiddenColumns={["id"]}
          loadingMessage="Loading notes..."
          emptyMessage={
            selectedProblemId
              ? "No notes found for this issue."
              : "Select an issue to view notes."
          }
        />
      </div>

      {notesError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {notesError}
        </p>
      ) : null}

      <div className="space-y-3">
        <h2 className={subheadingClassName}>Photos</h2>
        <IssueStatusThumbnails
          photos={photos}
          loading={loadingPhotos}
          emptyMessage={
            selectedNoteId
              ? "No photos found for this note."
              : "Select a note to view photos."
          }
        />
      </div>

      {photosError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {photosError}
        </p>
      ) : null}
    </div>
  );
}
