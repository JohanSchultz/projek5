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

export default function PhotoCapture() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [filename, setFilename] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    setError(null);
    setCapturedPhoto(null);
    setFilename("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported on this device or browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

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
    if (!video) return;

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
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={capturePhoto}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
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
