"use client";

import {
  BIRTHDAYS_EXCEL_ERROR,
  parseBirthdaysExcelFile,
} from "@/lib/verjaarsdae-excel";
import { useState } from "react";

const IMPORT_ERROR =
  BIRTHDAYS_EXCEL_ERROR;

export default function VerjaarsdaeFileDrop() {
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exportingPptx, setExportingPptx] = useState(false);

  async function processFile(file) {
    if (!file) {
      return;
    }

    setError(null);
    setMessage(null);
    setFileName("");
    setImporting(true);

    try {
      const rows = await parseBirthdaysExcelFile(file);

      const response = await fetch("/api/verjaarsdae/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not import birthdays.");
      }

      setFileName(file.name);
      setMessage(
        `Imported ${result.importedCount ?? rows.length} row(s) successfully.`
      );
    } catch (importError) {
      setFileName("");
      setError(
        importError instanceof Error && importError.message
          ? importError.message
          : IMPORT_ERROR
      );
    } finally {
      setImporting(false);
    }
  }

  async function handleFiles(fileList) {
    const file = fileList?.[0];

    if (!file) {
      return;
    }

    await processFile(file);
  }

  function handleDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  function handleFileInputChange(event) {
    handleFiles(event.target.files);
    event.target.value = "";
  }

  async function handleDownloadPowerpoint() {
    setExportingPptx(true);
    setError(null);

    try {
      const response = await fetch("/api/verjaarsdae/powerpoint");

      if (!response.ok) {
        let message = "Could not create PowerPoint file.";
        try {
          const result = await response.json();
          if (result.error) {
            message = result.error;
          }
        } catch {
          // binary or empty body
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Verjaarsdae.pptx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(
        exportError instanceof Error && exportError.message
          ? exportError.message
          : "Could not create PowerPoint file."
      );
    } finally {
      setExportingPptx(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40"
            : "border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/50"
        }`}
      >
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {importing ? "Processing file..." : "Drag an Excel file here"}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Columns: Tag, Noemnaam, Van, Ouderdom, Verjaardag, Selfoon
        </p>
        <label className="mt-4 cursor-pointer text-sm font-medium text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100">
          Or choose a file
          <input
            type="file"
            accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            disabled={importing}
            onChange={handleFileInputChange}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleDownloadPowerpoint}
        disabled={importing || exportingPptx}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-green-300 bg-green-100 px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-green-800 dark:bg-green-950/50 dark:text-zinc-100 dark:hover:bg-green-900/50"
      >
        {exportingPptx ? "Besig om PowerPoint te bou..." : "Kry Powerpoint"}
      </button>

      {fileName ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Last file: {fileName}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}