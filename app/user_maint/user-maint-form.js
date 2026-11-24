"use client";

import { useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export default function UserMaintForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const canSave = Boolean(username.trim()) && Boolean(password);

  async function handleSave() {
    setError(null);
    setMessage(null);

    if (!canSave) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/user_maint/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not save the user.");
      }

      setUsername("");
      setPassword("");
      setMessage(`User "${result.email}" saved successfully.`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the user."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="username"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClassName}
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !canSave}
        className="inline-flex h-11 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/50 px-5 text-sm font-medium text-blue-950 transition-colors hover:bg-blue-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-400/30 dark:bg-blue-500/30 dark:text-blue-50 dark:hover:bg-blue-500/50"
      >
        {saving ? "Saving..." : "Save"}
      </button>

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