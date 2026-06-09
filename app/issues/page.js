import BuildingSelect from "./building-select";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";

async function IssuesDropdowns() {
  const supabase = await createClient();
  const [buildingsResult, techniciansResult, activeProblemsResult] =
    await Promise.all([
      supabase.rpc("pr_buildings"),
      supabase.rpc("pr_technicians"),
      supabase.rpc("pr_problems_active"),
    ]);

  if (buildingsResult.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Could not load buildings</p>
        <p className="mt-1 text-sm">{buildingsResult.error.message}</p>
      </div>
    );
  }

  if (techniciansResult.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Could not load technicians</p>
        <p className="mt-1 text-sm">{techniciansResult.error.message}</p>
      </div>
    );
  }

  if (activeProblemsResult.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Could not load active problems</p>
        <p className="mt-1 text-sm">{activeProblemsResult.error.message}</p>
      </div>
    );
  }

  const buildings = [...(buildingsResult.data ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
  const technicians = [...(techniciansResult.data ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
  const activeProblems = activeProblemsResult.data ?? [];

  return (
    <BuildingSelect
      buildings={buildings}
      technicians={technicians}
      activeProblems={activeProblems}
    />
  );
}

export default function IssuesPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Issues
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Select a building, area, and technician
            </p>
          </div>
          <Link
            href="/menu"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            ← Menu
          </Link>
        </div>

        <Suspense
          fallback={
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          }
        >
          <IssuesDropdowns />
        </Suspense>
      </main>
    </div>
  );
}
