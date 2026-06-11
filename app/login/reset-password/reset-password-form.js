"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function establishRecoverySession() {
      const supabase = createClient();
      setCheckingSession(true);
      setError(null);

      try {
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        if (code) {
          const { error: codeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (codeError) {
            throw codeError;
          }
        } else if (tokenHash && type) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });

          if (otpError) {
            throw otpError;
          }
        } else if (typeof window !== "undefined" && window.location.hash) {
          const hashParams = new URLSearchParams(
            window.location.hash.replace(/^#/, "")
          );
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              throw sessionError;
            }
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error(
            "This reset link is invalid or has expired. Request a new one from the Change Password page."
          );
        }

        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", "/login/reset-password");
        }

        setSessionReady(true);
      } catch (sessionError) {
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Could not verify the reset link."
        );
      } finally {
        setCheckingSession(false);
      }
    }

    establishRecoverySession();
  }, [searchParams]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!sessionReady) {
      setError(
        "Your reset session is not ready. Request a new reset link and try again."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (checkingSession) {
    return (
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Verifying reset link...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          New Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={!sessionReady}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={!sessionReady}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className={inputClassName}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || !sessionReady}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
