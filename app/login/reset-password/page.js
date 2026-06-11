import ResetPasswordForm from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Set New Password
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Enter and confirm your new password.
          </p>
        </div>

        <ResetPasswordForm />
      </main>
    </div>
  );
}
