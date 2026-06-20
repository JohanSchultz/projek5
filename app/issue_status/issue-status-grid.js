function formatReportDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${String(dateString).split("T")[0]}T00:00:00`);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

function getColumnLabel(key) {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
}

export function getRowField(row, fieldName) {
  const key = Object.keys(row).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? row[key] : undefined;
}

const DEFAULT_DATE_COLUMNS = new Set([
  "report_date",
  "estimated_resolve_date",
  "actual_resolve_date",
]);

function normalizeDateColumns(dateColumns) {
  if (dateColumns instanceof Set) {
    return dateColumns;
  }

  return new Set(dateColumns ?? []);
}

function formatCellValue(key, value, dateColumns = DEFAULT_DATE_COLUMNS) {
  if (normalizeDateColumns(dateColumns).has(key.toLowerCase())) {
    return formatReportDate(value);
  }

  return value ?? "";
}

function getVisibleColumns(rows, hiddenColumns = []) {
  if (!rows.length) {
    return [];
  }

  const hidden = new Set(hiddenColumns.map((column) => column.toLowerCase()));

  return Object.keys(rows[0])
    .filter((key) => !hidden.has(key.toLowerCase()))
    .map((key) => ({
      key,
      label: getColumnLabel(key),
    }));
}

export default function IssueStatusGrid({
  rows,
  loading = false,
  selectedRowId = null,
  onSelectRow,
  loadingMessage = "Loading...",
  emptyMessage = "No data found.",
  hiddenColumns = [],
  dateColumns = DEFAULT_DATE_COLUMNS,
}) {
  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{loadingMessage}</p>
    );
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{emptyMessage}</p>
    );
  }

  const columns = getVisibleColumns(rows, hiddenColumns);
  const isSelectable = Boolean(onSelectRow);

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            {columns.map((column, columnIndex) => (
              <th
                key={`${column.key}-${columnIndex}`}
                scope="col"
                className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
          {rows.map((row, index) => {
            const rowId = getRowField(row, "id");
            const isSelected = selectedRowId === rowId;

            return (
              <tr
                key={`row-${index}`}
                data-id={rowId ?? index}
                onClick={isSelectable ? () => onSelectRow(row) : undefined}
                className={
                  isSelectable
                    ? `cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-green-100/70 dark:bg-green-900/30"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      }`
                    : undefined
                }
              >
                {columns.map((column, columnIndex) => (
                  <td
                    key={`${column.key}-${columnIndex}`}
                    className="px-4 py-3 text-zinc-700 dark:text-zinc-300"
                  >
                    {formatCellValue(
                      column.key,
                      getRowField(row, column.key),
                      dateColumns
                    )}
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
