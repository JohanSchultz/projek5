import ChangePasswordForm from "./change-password-form";
import { Suspense } from "react";

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Change Password
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Enter your email address and we will send you a link to reset your
            password.
          </p>
        </div>

        <Suspense
          fallback={
            <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          }
        >
          <ChangePasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
