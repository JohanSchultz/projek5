import KonsensusTree from "@/components/konsensus-tree";
import { createClient } from "@/lib/supabase/server";

export default async function KonsensusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-10 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Konsensus
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Signed in as {user?.email}
            </p>
          </div>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Sign out
            </button>
          </form>
        </div>

        <KonsensusTree userEmail={user?.email} />
      </main>
    </div>
  );
}
