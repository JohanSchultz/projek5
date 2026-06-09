function formatNoteDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

const columns = [
  { key: "name", label: "Technician" },
  { key: "note", label: "Note" },
  { key: "note_date", label: "Note Date" },
];

export default function NotesGrid({
  notes,
  loading = false,
  selectedNoteId = null,
  onSelectNote,
}) {
  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading notes...
      </p>
    );
  }

  if (!notes.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No notes found for this problem.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
          {notes.map((noteRow) => {
            const isSelected = selectedNoteId === noteRow.id;

            return (
              <tr
                key={noteRow.id}
                data-id={noteRow.id}
                onClick={() => onSelectNote?.(noteRow)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-green-100/70 dark:bg-green-900/30"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-zinc-700 dark:text-zinc-300"
                  >
                    {column.key === "note_date"
                      ? formatNoteDate(noteRow.note_date)
                      : (noteRow[column.key] ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
