"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

function getNoteIdFromSession() {
  if (typeof window === "undefined") {
    return "";
  }

  const stored = sessionStorage.getItem("notesPhotosContext");

  if (!stored) {
    return "";
  }

  try {
    const parsed = JSON.parse(stored);
    return parsed.noteId ?? "";
  } catch {
    return "";
  }
}

function getNoteId() {
  if (typeof document === "undefined") {
    return getNoteIdFromSession();
  }

  const noteIdInput = document.getElementById("note_id");
  const noteIdFromInput = noteIdInput?.value?.trim() ?? "";

  if (noteIdFromInput) {
    return noteIdFromInput;
  }

  return getNoteIdFromSession();
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = atob(base64);
  const array = new Uint8Array(bytes.length);

  for (let index = 0; index < bytes.length; index += 1) {
    array[index] = bytes.charCodeAt(index);
  }

  return new Blob([array], { type: mime });
}

const MAX_IMAGE_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Could not load the photo for compression."));
    image.src = src;
  });
}

function compressImage(image, maxDimension = MAX_IMAGE_DIMENSION) {
  let targetWidth = image.width;
  let targetHeight = image.height;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth >= targetHeight) {
      targetWidth = maxDimension;
      targetHeight = Math.round((image.height / image.width) * maxDimension);
    } else {
      targetHeight = maxDimension;
      targetWidth = Math.round((image.width / image.height) * maxDimension);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare the photo for upload.");
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

async function compressFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  return compressImage(image);
}

async function compressDataUrl(dataUrl) {
  const image = await loadImage(dataUrl);
  return compressImage(image);
}

async function parseUploadResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    if (response.status === 413 || /request entity too large/i.test(text)) {
      throw new Error(
        "Photo is too large to upload. Try taking the photo again closer to the subject."
      );
    }

    throw new Error(
      text.trim() || "Could not upload the photo. The server returned an unexpected response."
    );
  }
}

function isMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function configureVideoElement(video) {
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.setAttribute("muted", "true");
  video.setAttribute("autoplay", "true");
}

async function getCameraStream() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter((device) => device.kind === "videoinput");

  const backCamera = videoDevices.find((device) =>
    /back|rear|environment/i.test(device.label)
  );
  const frontCamera = videoDevices.find((device) =>
    /front|user|selfie/i.test(device.label)
  );

  const constraints = [];

  if (backCamera?.deviceId) {
    constraints.push({
      video: { deviceId: { exact: backCamera.deviceId } },
      audio: false,
    });
  }

  if (frontCamera?.deviceId) {
    constraints.push({
      video: { deviceId: { exact: frontCamera.deviceId } },
      audio: false,
    });
  }

  constraints.push(
    { video: { facingMode: { exact: "environment" } }, audio: false },
    { video: { facingMode: "environment" }, audio: false },
    { video: { facingMode: "user" }, audio: false },
    { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: true, audio: false }
  );

  let lastError;

  for (const constraint of constraints) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraint);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Could not access the camera.");
}

function waitForVideoFrame(video, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
      resolve();
      return;
    }

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Camera preview did not become ready in time."));
    }, timeoutMs);

    const onReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("playing", onReady);
    };

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("playing", onReady);
  });
}

async function attachStreamToVideo(video, stream) {
  configureVideoElement(video);
  video.srcObject = stream;
  await video.play();
  await waitForVideoFrame(video);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected photo."));
    reader.readAsDataURL(file);
  });
}

export default function PhotoCapture() {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [filename, setFilename] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [noteId, setNoteId] = useState("");
  const [useNativeCamera] = useState(() => isMobileDevice());

  async function loadPhotos() {
    const noteId = getNoteId();

    if (!noteId) {
      setPhotos([]);
      setPhotosError(null);
      return;
    }

    setLoadingPhotos(true);
    setPhotosError(null);

    try {
      const supabase = createClient();
      const { data, error: loadPhotosError } = await supabase.rpc(
        "pr_photos_by_note_id_id",
        { p_note_id: Number(noteId) }
      );

      if (loadPhotosError) {
        throw loadPhotosError;
      }

      const photoRows = data ?? [];
      const photosWithUrls = await Promise.all(
        photoRows.map(async (row) => {
          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from("issues")
              .createSignedUrl(row.path, 3600);

          if (signedUrlError || !signedUrlData?.signedUrl) {
            return null;
          }

          return {
            path: row.path,
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
          : "Could not load photos for this note."
      );
    } finally {
      setLoadingPhotos(false);
    }
  }

  useEffect(() => {
    const resolvedNoteId = getNoteId();
    setNoteId(resolvedNoteId);
    loadPhotos();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setVideoReady(false);
  }

  async function recordPhoto(noteId, uploadedFilename) {
    const supabase = createClient();
    const { error: recordPhotoError } = await supabase.rpc("pi_photo", {
      p_note_id: Number(noteId),
      p_path: `${noteId}/${uploadedFilename}`,
    });

    if (recordPhotoError) {
      throw recordPhotoError;
    }
  }

  async function uploadPhoto(dataUrl) {
    const noteId = getNoteId();
    const formData = new FormData();
    formData.append("file", dataUrlToBlob(dataUrl), `photo-${Date.now()}.jpg`);

    if (noteId) {
      formData.append("noteId", noteId);
    }

    const response = await fetch("/api/photos/upload", {
      method: "POST",
      body: formData,
    });

    const result = await parseUploadResponse(response);

    if (!response.ok) {
      throw new Error(result.error ?? "Could not upload the photo.");
    }

    setFilename(result.filename);

    if (!noteId) {
      throw new Error("No note was selected. Return to Notes and select a note first.");
    }

    await recordPhoto(noteId, result.filename);
    setNoteId(noteId);
    await loadPhotos();
  }

  async function saveCapturedPhoto(dataUrl) {
    setCapturedPhoto(dataUrl);
    setUploading(true);
    setError(null);
    setFilename("");

    try {
      await uploadPhoto(dataUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload the photo to Supabase storage."
      );
    } finally {
      setUploading(false);
    }
  }

  function openNativeCamera() {
    setError(null);
    setCapturedPhoto(null);
    setFilename("");
    fileInputRef.current?.click();
  }

  async function handleNativePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const dataUrl = await compressFile(file);
      await saveCapturedPhoto(dataUrl);
    } catch (photoError) {
      setError(
        photoError instanceof Error
          ? photoError.message
          : "Could not process the selected photo."
      );
    }
  }

  async function startCamera() {
    setError(null);
    setCapturedPhoto(null);
    setFilename("");
    setVideoReady(false);

    if (useNativeCamera) {
      openNativeCamera();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported on this device or browser.");
      return;
    }

    try {
      const stream = await getCameraStream();
      streamRef.current = stream;

      flushSync(() => {
        setCameraActive(true);
      });

      const video = videoRef.current;
      if (!video) {
        throw new Error("Camera preview could not be initialized.");
      }

      await attachStreamToVideo(video, stream);
      setVideoReady(true);
    } catch (cameraError) {
      stopCamera();
      setError(
        cameraError instanceof Error
          ? cameraError.message
          : "Could not access the camera. Check permissions and try again."
      );
    }
  }

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video || !videoReady) return;

    try {
      await waitForVideoFrame(video);
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Camera preview is not ready yet."
      );
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = await compressDataUrl(
      canvas.toDataURL("image/jpeg", JPEG_QUALITY)
    );

    stopCamera();
    await saveCapturedPhoto(dataUrl);
  }

  function resetPhoto() {
    setCapturedPhoto(null);
    setFilename("");
    setError(null);
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativePhoto}
      />

      <div>
        <label
          htmlFor="filename"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          filename
        </label>
        <input
          id="filename"
          type="text"
          readOnly
          value={filename}
          placeholder={uploading ? "Uploading..." : "No photo saved yet"}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      {!cameraActive && !capturedPhoto ? (
        <button
          type="button"
          onClick={startCamera}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Take Photo
        </button>
      ) : null}

      {cameraActive ? (
        <div className="space-y-4">
          <video
            ref={videoRef}
            className="aspect-[4/3] w-full rounded-lg border border-zinc-200 bg-black object-cover dark:border-zinc-800"
          />
          {!videoReady ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Starting camera preview...
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={capturePhoto}
              disabled={!videoReady}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Capture
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {capturedPhoto ? (
        <div className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={capturedPhoto}
            alt="Captured photo"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
          />
          {uploading ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Saving photo...
            </p>
          ) : null}
          <button
            type="button"
            onClick={resetPhoto}
            disabled={uploading}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Take Photo
          </button>
        </div>
      ) : null}

      <div>
        {loadingPhotos ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading photos...
          </p>
        ) : null}

        {!loadingPhotos && photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((photo) => (
              <button
                key={photo.path}
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                className="cursor-pointer overflow-hidden rounded-lg border border-zinc-200 transition-opacity hover:opacity-80 dark:border-zinc-800"
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
        ) : null}

        {!loadingPhotos && !photos.length && noteId ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No photos found for this note.
          </p>
        ) : null}

        {photosError ? (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {photosError}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

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
    </div>
  );
}
