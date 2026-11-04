const VISIBLE_COLUMNS = [
  { key: "descr", label: "Description" },
  { key: "qty", label: "Qty" },
  { key: "unit_price", label: "Unit Price" },
  { key: "total", label: "Total" },
  { key: "technician", label: "Technician" },
];

function getRowField(row, fieldName) {
  const key = Object.keys(row).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? row[key] : undefined;
}

function getRowId(row) {
  return getRowField(row, "id");
}

function formatTotal(costItemRow) {
  const qty = Number(getRowField(costItemRow, "qty"));
  const unitPrice = Number(getRowField(costItemRow, "unit_price"));

  if (Number.isNaN(qty) || Number.isNaN(unitPrice)) {
    return "";
  }

  const total = qty * unitPrice;

  return Number.isInteger(total) ? String(total) : total.toFixed(2);
}

function getCellValue(costItemRow, columnKey) {
  if (columnKey === "total") {
    return formatTotal(costItemRow);
  }

  return getRowField(costItemRow, columnKey) ?? "";
}

export default function CostItemsGrid({
  costItems,
  loading = false,
  selectedCostItemId = null,
  onSelectCostItem,
}) {
  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading cost items...
      </p>
    );
  }

  if (!costItems.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No cost items found for this problem.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            {VISIBLE_COLUMNS.map((column) => (
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
          {costItems.map((costItemRow, index) => {
            const rowId = getRowId(costItemRow);
            const isSelected =
              selectedCostItemId !== null &&
              String(selectedCostItemId) === String(rowId);

            return (
              <tr
                key={rowId ?? index}
                data-id={rowId}
                onClick={() => onSelectCostItem?.(costItemRow)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-green-100/70 dark:bg-green-900/30"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                <td className="hidden">
                  <input
                    type="text"
                    readOnly
                    hidden
                    value={rowId ?? ""}
                    aria-hidden
                  />
                </td>
                {VISIBLE_COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-zinc-700 dark:text-zinc-300"
                  >
                    {getCellValue(costItemRow, column.key)}
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
