"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["Todo", "In Progress", "Done"];

function toDatetimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TaskForm({ task, users, onSubmit, onClose }) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "Todo",
    deadline: toDatetimeLocal(task?.deadline),
    assignee_id: task?.assignee_id || "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        assignee_id: form.assignee_id || null,
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || "Gagal menyimpan task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
      <div className="card shadow-panel w-full max-w-lg p-7 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:rounded-t-lg before:bg-amber-400">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="font-mono-ui text-[11px] uppercase tracking-widest text-amber-600 mb-1">
              {isEdit ? "Edit entri" : "Entri baru"}
            </p>
            <h2 className="font-display text-2xl text-ink-900">
              {isEdit ? "Ubah Task" : "Tambah Task"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-300 hover:text-ink-700 text-xl leading-none mt-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div>
            <label className="label">Judul</label>
            <input className="input" value={form.title} onChange={handleChange("title")} required />
          </div>

          <div>
            <label className="label">Deskripsi</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={handleChange("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={handleChange("status")}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Deadline</label>
              <input
                type="datetime-local"
                className="input"
                value={form.deadline}
                onChange={handleChange("deadline")}
              />
            </div>
          </div>

          <div>
            <label className="label">Assignee</label>
            <select className="input" value={form.assignee_id} onChange={handleChange("assignee_id")}>
              <option value="">— Belum ditentukan —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.username})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-clay-600 bg-clay-50 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
