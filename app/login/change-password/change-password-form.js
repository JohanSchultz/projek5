"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export default function ChangePasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSending(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const nextPath = encodeURIComponent("/login/reset-password");
    const redirectTo = `${window.location.origin}/auth/callback?next=${nextPath}`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo }
    );

    setSending(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage(
      "If an account exists for this email address, a password reset link has been sent."
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClassName}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {sending ? "Sending..." : "Send reset link"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href="/login"
          className="font-medium text-zinc-800 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-zinc-50"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
