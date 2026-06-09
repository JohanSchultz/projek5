import PhotoCapture from "./photo-capture";
import PhotosContextFields from "./photos-context-fields";
import Link from "next/link";

export default function PhotosPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Photos
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Assessment photo capture
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link
              href="/menu"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              ← Menu
            </Link>
            <Link
              href="/notes"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              ← Notes
            </Link>
          </div>
        </div>

        <PhotosContextFields />
        <PhotoCapture />
      </main>
    </div>
  );
}
