const VISIBLE_COLUMNS = [
  { key: "topic_text", label: "Topic" },
  { key: "yes", label: "Vote" },
  { key: "votes", label: "Vote-count" },
  { key: "total_weight", label: "Total weight" },
];

function getRowField(row, fieldName) {
  const key = Object.keys(row).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? row[key] : undefined;
}

export function formatSummaryCellValue(key, value) {
  if (key.toLowerCase() === "yes") {
    if (value === true || value === "true" || value === 1 || value === "1") {
      return "Yes";
    }

    if (value === false || value === "false" || value === 0 || value === "0") {
      return "No";
    }
  }

  return value ?? "";
}

export function getSummaryColumns(rows) {
  if (!rows.length) {
    return VISIBLE_COLUMNS;
  }

  return VISIBLE_COLUMNS.filter((column) =>
    Object.keys(rows[0]).some(
      (key) => key.toLowerCase() === column.key.toLowerCase()
    )
  );
}

function formatCellValue(key, value) {
  return formatSummaryCellValue(key, value);
}

function getVisibleColumns(rows) {
  return getSummaryColumns(rows);
}

export default function SummaryGrid({ rows, loading = false }) {
  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading report...
      </p>
    );
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No report data found for this meeting.
      </p>
    );
  }

  const columns = getVisibleColumns(rows);

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
          {rows.map((row, index) => (
            <tr key={row.id ?? index}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3 text-zinc-700 dark:text-zinc-300"
                >
                  {formatCellValue(column.key, getRowField(row, column.key))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
