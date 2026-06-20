const HIDDEN_COLUMNS = new Set([
  "meeting_id",
  "meetingid",
  "building",
  "building_name",
  "buildingname",
  "meeting_date",
  "meetingdate",
]);

const COLUMN_LABELS = {
  yes: "Vote",
};

function getColumnLabel(key) {
  return (
    COLUMN_LABELS[key.toLowerCase()] ??
    key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
  );
}

function isHiddenColumn(key) {
  return HIDDEN_COLUMNS.has(key.toLowerCase());
}

export function formatReportCellValue(key, value) {
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

export function getReportColumns(rows) {
  if (!rows.length) {
    return [];
  }

  return Object.keys(rows[0])
    .filter((key) => !isHiddenColumn(key))
    .map((key) => ({
      key,
      label: getColumnLabel(key),
    }));
}

function formatCellValue(key, value) {
  return formatReportCellValue(key, value);
}

function getVisibleColumns(rows) {
  return getReportColumns(rows);
}

export default function DetailGrid({ rows, loading = false }) {
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
                  {formatCellValue(column.key, row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
