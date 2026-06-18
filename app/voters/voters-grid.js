const HIDDEN_COLUMNS = new Set(["id", "building_id", "is_active"]);

const COLUMN_LABELS = {
  name: "Voter",
  buildingname: "Building",
  idnumber: "ID Number",
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

function getVisibleColumns(voters) {
  if (!voters.length) {
    return [
      { key: "name", label: "Voter" },
      { key: "buildingname", label: "Building" },
    ];
  }

  return Object.keys(voters[0])
    .filter((key) => !isHiddenColumn(key))
    .map((key) => ({
      key,
      label: getColumnLabel(key),
    }));
}

export default function VotersGrid({
  voters,
  loading = false,
  selectedVoterId = null,
  onSelectVoter,
}) {
  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading voters...
      </p>
    );
  }

  if (!voters.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No voters found for this building.
      </p>
    );
  }

  const columns = getVisibleColumns(voters);

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
          {voters.map((voterRow) => {
            const isSelected = selectedVoterId === voterRow.id;

            return (
              <tr
                key={voterRow.id}
                data-id={voterRow.id}
                onClick={() => onSelectVoter?.(voterRow)}
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
                    {voterRow[column.key] ?? ""}
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
