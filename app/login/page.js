import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Use your Supabase account credentials
          </p>
        </div>

        <Suspense
          fallback={
            <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
