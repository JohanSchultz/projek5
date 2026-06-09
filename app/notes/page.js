import NotesForm from "./notes-form";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";

async function NotesContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pr_technicians");

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Could not load technicians</p>
        <p className="mt-1 text-sm">{error.message}</p>
      </div>
    );
  }

  const technicians = [...(data ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  return <NotesForm technicians={technicians} />;
}

export default function NotesPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Notes
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Problem notes
            </p>
          </div>
          <Link
            href="/issues"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            ← Issues
          </Link>
        </div>

        <Suspense
          fallback={
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          }
        >
          <NotesContent />
        </Suspense>
      </main>
    </div>
  );
}
