const HIDDEN_COLUMNS = new Set(["id", "meeting_name", "building_id"]);

const COLUMN_LABELS = {
  meeting_date: "Meeting Date",
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

function getVisibleColumns(meetings) {
  if (!meetings.length) {
    return [{ key: "meeting_date", label: "Meeting Date" }];
  }

  return Object.keys(meetings[0])
    .filter((key) => !isHiddenColumn(key))
    .map((key) => ({
      key,
      label: getColumnLabel(key),
    }));
}

function formatMeetingDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString.split("T")[0]}T00:00:00`);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

export default function MeetingsGrid({
  meetings,
  loading = false,
  selectedMeetingId = null,
  onSelectMeeting,
}) {
  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading meetings...
      </p>
    );
  }

  if (!meetings.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No meetings found for this building.
      </p>
    );
  }

  const columns = getVisibleColumns(meetings);

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
          {meetings.map((meetingRow) => {
            const isSelected = selectedMeetingId === meetingRow.id;

            return (
              <tr
                key={meetingRow.id}
                data-id={meetingRow.id}
                onClick={() => onSelectMeeting?.(meetingRow)}
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
                    {column.key.toLowerCase() === "meeting_date"
                      ? formatMeetingDate(meetingRow[column.key])
                      : (meetingRow[column.key] ?? "")}
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
