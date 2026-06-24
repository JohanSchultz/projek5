const HIDDEN_COLUMNS = new Set(["id", "is_locked"]);

const COLUMN_LABELS = {
  topic_text: "Topic",
};

const narrowCellClassName = "whitespace-nowrap px-2 py-3 text-zinc-700 dark:text-zinc-300";
const narrowHeaderClassName =
  "whitespace-nowrap px-2 py-3 font-medium text-zinc-700 dark:text-zinc-300";

function getColumnLabel(key) {
  return (
    COLUMN_LABELS[key.toLowerCase()] ??
    key.charAt(0).toUpperCase() + key.slice(1)
  );
}

function isHiddenColumn(key) {
  return HIDDEN_COLUMNS.has(key.toLowerCase());
}

function getTopicField(topicRow, fieldName) {
  const key = Object.keys(topicRow).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? topicRow[key] : undefined;
}

function parseIsLocked(value) {
  return (
    value === true || value === "true" || value === 1 || value === "1"
  );
}

function getVisibleColumns(topics) {
  if (!topics.length) {
    return [{ key: "topic_text", label: "Topic" }];
  }

  return Object.keys(topics[0])
    .filter((key) => !isHiddenColumn(key))
    .map((key) => ({
      key,
      label: getColumnLabel(key),
    }));
}

export default function VotingTopicsGrid({
  topics,
  loading = false,
  selectedTopicId = null,
  lockingTopicId = null,
  onSelectTopic,
  onToggleLock,
}) {
  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading topics...
      </p>
    );
  }

  if (!topics.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No topics found for this meeting.
      </p>
    );
  }

  const columns = getVisibleColumns(topics);

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
            <th scope="col" className={`${narrowHeaderClassName} w-24`} />
            <th scope="col" className={`${narrowHeaderClassName} w-24`} />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
          {topics.map((topicRow) => {
            const isSelected = selectedTopicId === topicRow.id;
            const isLocked = parseIsLocked(getTopicField(topicRow, "is_locked"));
            const isLocking = lockingTopicId === topicRow.id;

            return (
              <tr
                key={topicRow.id}
                data-id={topicRow.id}
                onClick={() => onSelectTopic?.(topicRow)}
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
                    {topicRow[column.key] ?? ""}
                  </td>
                ))}
                <td className={`${narrowCellClassName} w-24 text-xs`}>
                  {isLocked ? "Locked" : "Unlocked"}
                </td>
                <td className={`${narrowCellClassName} w-24`}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleLock?.(topicRow, !isLocked);
                    }}
                    disabled={isLocking || !onToggleLock}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-300 bg-white px-2 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                  >
                    {isLocking
                      ? "..."
                      : isLocked
                        ? "Unlock"
                        : "Lock"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
