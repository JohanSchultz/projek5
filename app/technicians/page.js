import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";

async function TechniciansList() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("technicians").select("*");

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Could not load technicians</p>
        <p className="mt-1 text-sm">{error.message}</p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="space-y-2 text-zinc-600 dark:text-zinc-400">
        <p>
          No rows returned from{" "}
          <code className="text-sm">public.technicians</code>.
        </p>
        <p className="text-sm">
          If the table has data in Supabase, Row Level Security is likely
          blocking reads. Add a SELECT policy for the{" "}
          <code className="text-sm">anon</code> role on this table.
        </p>
      </div>
    );
  }

  return (
    <pre className="overflow-auto rounded-lg bg-zinc-100 p-4 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function TechniciansPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Technicians
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Data from <code>public.technicians</code>
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            ← Home
          </Link>
        </div>

        <Suspense
          fallback={
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading technicians...
            </p>
          }
        >
          <TechniciansList />
        </Suspense>
      </main>
    </div>
  );
}
