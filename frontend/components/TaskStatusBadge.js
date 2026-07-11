"use client";

const STATUS_STYLES = {
  Todo: "bg-ink-50 text-ink-500 border-ink-100",
  "In Progress": "bg-amber-50 text-amber-600 border-amber-200",
  Done: "bg-teal-50 text-teal-600 border-teal-200",
};

const STATUS_DOT = {
  Todo: "bg-ink-300",
  "In Progress": "bg-amber-500",
  Done: "bg-teal-500",
};

export default function TaskStatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || "bg-ink-50 text-ink-500 border-ink-100"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || "bg-ink-300"}`} />
      {status}
    </span>
  );
}
