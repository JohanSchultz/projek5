"use client";

import { useEffect, useState } from "react";

export default function IssueStatusThumbnails({
  photos,
  loading = false,
  emptyMessage = "No photos found.",
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedPhoto(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhoto]);

  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading photos...</p>
    );
  }

  if (!photos.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{emptyMessage}</p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <button
            key={`${photo.path}-${index}`}
            type="button"
            onClick={() => setSelectedPhoto(photo)}
            className="overflow-hidden rounded-lg border border-zinc-200 transition hover:opacity-90 dark:border-zinc-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.path}
              className="aspect-square w-full object-cover"
            />
          </button>
        ))}
      </div>

      {selectedPhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
          role="presentation"
        >
          <div
            className="relative max-h-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Photo preview"
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-sm font-medium text-white hover:text-zinc-300"
            >
              Close
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.path}
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
