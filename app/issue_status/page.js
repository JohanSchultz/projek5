import IssueStatusContent from "./issue-status-content";
import Link from "next/link";

export default function IssueStatusPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-5xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Issue Status
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Problem status report
            </p>
          </div>
          <Link
            href="/menu"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            ← Menu
          </Link>
        </div>

        <IssueStatusContent />
      </main>
    </div>
  );
}
