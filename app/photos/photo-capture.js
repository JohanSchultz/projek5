"use client";

import { useEffect, useRef, useState } from "react";

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

async function getCameraStream() {
  const constraints = [
    { video: { facingMode: { ideal: "environment" } }, audio: false },
    { video: { facingMode: "user" }, audio: false },
    { video: true, audio: false },
  ];

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

function waitForVideoFrame(video) {
  return new Promise((resolve, reject) => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
      resolve();
      return;
    }

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Camera preview did not become ready in time."));
    }, 10000);

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

export default function PhotoCapture() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [filename, setFilename] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!cameraActive || !streamRef.current || !videoRef.current) {
      return undefined;
    }

    const video = videoRef.current;
    const stream = streamRef.current;
    let cancelled = false;

    async function attachStream() {
      setVideoReady(false);
      video.srcObject = stream;

      try {
        await video.play();
        await waitForVideoFrame(video);
        if (!cancelled) {
          setVideoReady(true);
        }
      } catch (previewError) {
        if (!cancelled) {
          setError(
            previewError instanceof Error
              ? previewError.message
              : "Could not start the camera preview."
          );
          stopCamera();
        }
      }
    }

    attachStream();

    return () => {
      cancelled = true;
      video.srcObject = null;
    };
  }, [cameraActive]);

  async function startCamera() {
    setError(null);
    setCapturedPhoto(null);
    setFilename("");
    setVideoReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported on this device or browser.");
      return;
    }

    try {
      const stream = await getCameraStream();
      streamRef.current = stream;
      setCameraActive(true);
    } catch (cameraError) {
      setError(
        cameraError instanceof Error
          ? cameraError.message
          : "Could not access the camera. Check permissions and try again."
      );
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setVideoReady(false);
  }

  async function uploadPhoto(dataUrl) {
    const formData = new FormData();
    formData.append("file", dataUrlToBlob(dataUrl), `photo-${Date.now()}.jpg`);

    const response = await fetch("/api/photos/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "Could not upload the photo.");
    }

    setFilename(result.filename);
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
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    stopCamera();
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

  function resetPhoto() {
    setCapturedPhoto(null);
    setFilename("");
    setError(null);
  }

  return (
    <div className="space-y-4">
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
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg border border-zinc-200 bg-black dark:border-zinc-800"
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
              Saving photo to issues/4...
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

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
