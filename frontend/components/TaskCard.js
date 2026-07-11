"use client";

import TaskStatusBadge from "./TaskStatusBadge";

const STATUS_OPTIONS = ["Todo", "In Progress", "Done"];

const ACCENT_BY_STATUS = {
  Todo: "before:bg-ink-300",
  "In Progress": "before:bg-amber-400",
  Done: "before:bg-teal-500",
};

function formatDeadline(value) {
  if (!value) return null;
  const d = new Date(value);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function isOverdue(value, status) {
  if (!value || status === "Done") return false;
  return new Date(value).getTime() < Date.now();
}

const initials = (name) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const deadline = formatDeadline(task.deadline);
  const overdue = isOverdue(task.deadline, task.status);

  return (
    <div
      className={`card relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:rounded-t-lg ${ACCENT_BY_STATUS[task.status] || ""} p-4 flex flex-col gap-3 hover:shadow-cardHover transition-shadow`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-[17px] leading-snug text-ink-900">{task.title}</h3>
      </div>

      {task.description && (
        <p className="text-[13px] text-ink-500 leading-relaxed line-clamp-3">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <TaskStatusBadge status={task.status} />
        {deadline && (
          <span
            className={`font-mono-ui text-[11px] tracking-wide px-2 py-0.5 rounded ${
              overdue ? "text-clay-600 bg-clay-50" : "text-ink-500"
            }`}
          >
            {overdue ? "⚠ " : "📅 "}
            {deadline}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-dashed border-ink-100">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <>
              <span className="w-6 h-6 rounded-full bg-ink-900 text-paper text-[10px] font-mono-ui font-semibold flex items-center justify-center flex-shrink-0">
                {initials(task.assignee.full_name)}
              </span>
              <span className="text-xs text-ink-500 truncate max-w-[90px]">
                {task.assignee.full_name}
              </span>
            </>
          ) : (
            <span className="text-xs text-ink-300 italic">Belum ditugaskan</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="text-xs text-ink-500 hover:text-ink-900 transition-colors"
            onClick={() => onEdit(task)}
          >
            Edit
          </button>
          <button
            className="text-xs text-clay-500 hover:text-clay-600 transition-colors"
            onClick={() => onDelete(task)}
          >
            Hapus
          </button>
        </div>
      </div>

      <select
        className="text-[11px] font-mono-ui border border-ink-100 rounded-md px-2 py-1.5 bg-ink-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-ink-700"
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            Pindah ke: {s}
          </option>
        ))}
      </select>
    </div>
  );
}
