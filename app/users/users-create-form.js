"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export default function UsersCreateForm() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [appNumber, setAppNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate(event) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, appNumber, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not create the user.");
      }

      setUserName("");
      setAppNumber("");
      setPassword("");
      setMessage(`User "${result.email}" created successfully.`);
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create the user."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="mb-8 space-y-4">
      <div>
        <label
          htmlFor="userName"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          User Name
        </label>
        <input
          id="userName"
          name="userName"
          type="text"
          autoComplete="username"
          required
          value={userName}
          onChange={(event) => setUserName(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="appNumber"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          App Number
        </label>
        <input
          id="appNumber"
          name="appNumber"
          type="number"
          inputMode="numeric"
          required
          value={appNumber}
          onChange={(event) => setAppNumber(event.target.value)}
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
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClassName}
        />
      </div>

      <button
        type="submit"
        disabled={creating}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {creating ? "Creating..." : "Create"}
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
    </form>
  );
}
