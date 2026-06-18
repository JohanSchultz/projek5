const HIDDEN_COLUMNS = new Set(["id"]);

const COLUMN_LABELS = {
  topic_text: "Topic",
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
  onSelectTopic,
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
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
          {topics.map((topicRow) => {
            const isSelected = selectedTopicId === topicRow.id;

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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
