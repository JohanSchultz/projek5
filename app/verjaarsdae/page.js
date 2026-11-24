import VerjaarsdaeFileDrop from "./verjaarsdae-file-drop";
import { createClient } from "@/lib/supabase/server";
import { isRoodiesAdmin } from "@/lib/menu-routing";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function VerjaarsdaePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isRoodiesAdmin(user.email)) {
    redirect("/menu");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Verjaarsdae
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Drag files into the drop zone
            </p>
          </div>
          <Link
            href="/menu_roodies"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            ← Menu
          </Link>
        </div>

        <VerjaarsdaeFileDrop />
      </main>
    </div>
  );
}