const EXCEL_COLUMNS = [
  { key: "building", label: "Building", excelColumn: 1 },
  { key: "topic_text", label: "Topic", excelColumn: 2 },
  { key: "result", label: "Result", excelColumn: 3 },
  { key: "meeting_date", label: "Meeting Date", excelColumn: 4 },
  { key: "yes_votes", label: "Yes Votes", excelColumn: 5 },
  { key: "no_votes", label: "No Votes", excelColumn: 6 },
  { key: "yes_weight", label: "Yes Weight", excelColumn: 7 },
  { key: "no_wieght", label: "No Weight", excelColumn: 8 },
];

const GRID_COLUMNS = [
  { key: "topic_text", label: "Topic" },
  { key: "result", label: "Result" },
  { key: "yes_votes", label: "Yes Votes" },
  { key: "no_votes", label: "No Votes" },
  { key: "yes_weight", label: "Yes Weight" },
  { key: "no_wieght", label: "No Weight" },
];

function filterColumnsByRows(columns, rows) {
  if (!rows.length) {
    return columns;
  }

  return columns.filter((column) =>
    Object.keys(rows[0]).some(
      (key) => key.toLowerCase() === column.key.toLowerCase()
    )
  );
}

function getRowField(row, fieldName) {
  const key = Object.keys(row).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? row[key] : undefined;
}

export function formatSummaryCellValue(_key, value) {
  return value ?? "";
}

function formatWeightValue(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return value;
  }

  return numericValue.toFixed(4);
}

function formatCellValue(key, value) {
  const keyLower = key.toLowerCase();

  if (keyLower === "yes_weight" || keyLower === "no_wieght") {
    return formatWeightValue(value);
  }

  return formatSummaryCellValue(key, value);
}

export function getSummaryColumns(rows) {
  return filterColumnsByRows(EXCEL_COLUMNS, rows);
}

export function getExcelColumns(rows) {
  return filterColumnsByRows(EXCEL_COLUMNS, rows);
}

export function getGridColumns(rows) {
  return filterColumnsByRows(GRID_COLUMNS, rows);
}

function getVisibleColumns(rows) {
  return getGridColumns(rows);
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
