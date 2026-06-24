const HIDDEN_COLUMNS = new Set([
  "id",
  "building_id",
  "voter_id",
  "voter",
  "is_active",
]);

const COLUMN_LABELS = {
  name: "Unit",
  unit: "Unit",
  weight: "Weight",
};

function getColumnLabel(key) {
  return (
    COLUMN_LABELS[key.toLowerCase()] ??
    key.charAt(0).toUpperCase() + key.slice(1)
  );
}

function isHiddenColumn(key) {
  return HIDDEN_COLUMNS.has(key.toLowerCase());
}

function getVisibleColumns(units) {
  if (!units.length) {
    return [
      { key: "name", label: "Unit" },
      { key: "weight", label: "Weight" },
    ];
  }

  const columns = Object.keys(units[0])
    .filter((key) => !isHiddenColumn(key))
    .map((key) => ({
      key,
      label: getColumnLabel(key),
    }));

  const weightColumns = columns.filter(
    (column) => column.key.toLowerCase() === "weight"
  );
  const otherColumns = columns.filter(
    (column) => column.key.toLowerCase() !== "weight"
  );

  return [...otherColumns, ...weightColumns];
}

export default function UnitsGrid({
  units,
  loading = false,
  selectedUnitId = null,
  onSelectUnit,
}) {
  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading units...</p>
    );
  }

  if (!units.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No units found for this building.
      </p>
    );
  }

  const columns = getVisibleColumns(units);

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
          {units.map((unitRow) => {
            const isSelected = selectedUnitId === unitRow.id;

            return (
              <tr
                key={unitRow.id}
                data-id={unitRow.id}
                onClick={() => onSelectUnit?.(unitRow)}
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
                    {unitRow[column.key] ?? ""}
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
