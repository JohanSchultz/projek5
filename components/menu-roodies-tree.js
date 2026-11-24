"use client";

import Link from "next/link";

const MENU_ENTRIES = [
  { id: "verjaarsdae", label: "Verjaarsdae", href: "/verjaarsdae" },
];

export default function MenuRoodiesTree() {
  return (
    <nav aria-label="Roodies menu">
      <ul className="space-y-1">
        {MENU_ENTRIES.map((entry) => (
          <li key={entry.id}>
            <Link
              href={entry.href}
              className="block w-full rounded-lg bg-yellow-50 px-3 py-2 text-left text-base text-zinc-700 transition-colors hover:bg-yellow-100 dark:text-zinc-800"
            >
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}