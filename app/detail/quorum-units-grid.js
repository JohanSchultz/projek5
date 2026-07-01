export function sortQuorumUnitNames(unitNames) {
  return [...unitNames].sort((left, right) => {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    const leftIsNumeric = !Number.isNaN(leftNumber);
    const rightIsNumeric = !Number.isNaN(rightNumber);

    if (leftIsNumeric && rightIsNumeric) {
      return leftNumber - rightNumber;
    }

    if (leftIsNumeric) {
      return -1;
    }

    if (rightIsNumeric) {
      return 1;
    }

    return String(left).localeCompare(String(right));
  });
}

export function normalizeQuorumUnitNames(data) {
  const unitNames = (data ?? []).map((row) => {
    if (row === null || row === undefined) {
      return "";
    }

    if (typeof row === "object") {
      const preferredKey = Object.keys(row).find((key) =>
        ["name", "unit_name", "unit"].includes(key.toLowerCase())
      );
      const key = preferredKey ?? Object.keys(row)[0];

      return key ? String(row[key] ?? "") : "";
    }

    return String(row);
  });

  return sortQuorumUnitNames(unitNames.filter(Boolean));
}

export default function QuorumUnitsGrid({ unitNames = [], loading = false }) {
  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading quorum units...
      </p>
    );
  }

  if (!unitNames.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No quorum units found for this meeting.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300"
            >
              Unit Name
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
          {unitNames.map((unitName, index) => (
            <tr key={`${unitName}-${index}`}>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                {unitName}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
