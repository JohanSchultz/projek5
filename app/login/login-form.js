"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState(null);
  const [error, setError] = useState(null);

  async function navigateAfterSignIn(userEmail) {
    const supabase = createClient();
    const { data, error: appError } = await supabase.rpc("pr_app_by_user", {
      p_email: userEmail,
    });

    if (appError) {
      throw appError;
    }

    const appNumber = Number(data);

    if (appNumber === 1) {
      router.push("/menu");
    } else if (appNumber === 2) {
      router.push("/konsensus");
    } else {
      throw new Error("Your account is not assigned to a valid application.");
    }

    router.refresh();
  }

  useEffect(() => {
    async function checkExistingSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setSignedInEmail(user?.email ?? null);
    }

    checkExistingSession();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      router.push(
        `/login/change-password?email=${encodeURIComponent(email)}`
      );
      return;
    }

    try {
      await navigateAfterSignIn(email);
    } catch (navigationError) {
      setError(
        navigationError instanceof Error
          ? navigationError.message
          : "Could not determine where to send you after sign-in."
      );
      setLoading(false);
    }
  }

  async function handleContinue() {
    if (!signedInEmail) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await navigateAfterSignIn(signedInEmail);
    } catch (navigationError) {
      setError(
        navigationError instanceof Error
          ? navigationError.message
          : "Could not determine where to send you after sign-in."
      );
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {signedInEmail ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <p>
            You are already signed in as{" "}
            <span className="font-medium">{signedInEmail}</span>.
          </p>
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="mt-2 font-medium text-zinc-900 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            Continue
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

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
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
    </div>
  );
}
