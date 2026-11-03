const VISIBLE_COLUMNS = [
  { key: "name", label: "Building Name" },
  { key: "is_active", label: "Active" },
];

function getRowField(row, fieldName) {
  const key = Object.keys(row).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? row[key] : undefined;
}

function formatCellValue(key, value) {
  if (key.toLowerCase() === "is_active") {
    if (value === true || value === "true" || value === 1 || value === "1") {
      return "Yes";
    }

    if (value === false || value === "false" || value === 0 || value === "0") {
      return "No";
    }
  }

  return value ?? "";
}

function getVisibleColumns(buildings) {
  if (!buildings.length) {
    return VISIBLE_COLUMNS;
  }

  return VISIBLE_COLUMNS.filter((column) =>
    Object.keys(buildings[0]).some(
      (key) => key.toLowerCase() === column.key.toLowerCase()
    )
  );
}

export default function MaintenanceBuildingsGrid({
  buildings,
  loading = false,
  selectedBuildingId = null,
  onSelectBuilding,
}) {
  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading buildings...
      </p>
    );
  }

  if (!buildings.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No buildings found.
      </p>
    );
  }

  const columns = getVisibleColumns(buildings);

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
          {buildings.map((buildingRow) => {
            const isSelected = selectedBuildingId === buildingRow.id;

            return (
              <tr
                key={buildingRow.id}
                data-id={buildingRow.id}
                onClick={() => onSelectBuilding?.(buildingRow)}
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
                    {formatCellValue(
                      column.key,
                      getRowField(buildingRow, column.key)
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
