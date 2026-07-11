"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import ChatbotWidget from "@/components/ChatbotWidget";

const COLUMNS = [
  { key: "Todo", label: "Todo", dot: "bg-ink-300" },
  { key: "In Progress", label: "In Progress", dot: "bg-amber-400" },
  { key: "Done", label: "Done", dot: "bg-teal-500" },
];

export default function TasksPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("Semua");

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [taskList, userList] = await Promise.all([api.listTasks(), api.listUsers()]);
      setTasks(taskList);
      setUsers(userList);
    } catch (err) {
      setError(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
      const matchesAssignee =
        assigneeFilter === "Semua" ||
        (assigneeFilter === "Unassigned" && !t.assignee) ||
        t.assignee?.id === assigneeFilter;
      return matchesSearch && matchesAssignee;
    });
  }, [tasks, search, assigneeFilter]);

  const tasksByStatus = (status) => filteredTasks.filter((t) => t.status === status);

  const handleCreate = async (payload) => {
    const newTask = await api.createTask(payload);
    setTasks((prev) => [newTask, ...prev]);
    setShowForm(false);
  };

  const handleUpdate = async (payload) => {
    const updated = await api.updateTask(editingTask.id, payload);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingTask(null);
  };

  const handleDelete = async (task) => {
    if (!confirm(`Hapus task "${task.title}"?`)) return;
    await api.deleteTask(task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  const handleStatusChange = async (taskId, status) => {
    const updated = await api.updateTaskStatus(taskId, status);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-paper">
        <p className="font-mono-ui text-sm text-ink-500">Memuat…</p>
      </main>
    );
  }

  const doneCount = tasks.filter((t) => t.status === "Done").length;

  return (
    <main className="min-h-screen pb-16">
      <header className="bg-white border-b border-ink-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="font-mono-ui text-[11px] uppercase tracking-widest text-amber-600 mb-0.5">
              Moonlay Technologies
            </p>
            <h1 className="font-display text-2xl text-ink-900">Papan Task</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-ink-900">{user.full_name}</p>
              <p className="text-xs text-ink-300 font-mono-ui">
                {doneCount}/{tasks.length} selesai
              </p>
            </div>
            <span className="w-9 h-9 rounded-full bg-ink-900 text-amber-400 text-xs font-mono-ui font-semibold flex items-center justify-center">
              {user.full_name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </span>
            <button className="btn-secondary text-sm" onClick={logout}>
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
          <div className="flex gap-2 flex-wrap items-center">
            <select
              className="text-xs font-mono-ui border border-ink-100 rounded-md px-2.5 py-2 bg-white text-ink-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="Semua">Semua assignee</option>
              <option value="Unassigned">Belum ditugaskan</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              className="input text-sm max-w-[220px]"
              placeholder="Cari judul task…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn-primary text-sm whitespace-nowrap" onClick={() => setShowForm(true)}>
              + Tambah Task
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-clay-600 bg-clay-50 rounded-md px-3 py-2 mb-4 inline-block">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm font-mono-ui text-ink-500">Memuat task…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {COLUMNS.map((col) => {
              const colTasks = tasksByStatus(col.key);
              return (
                <div key={col.key} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-3.5 px-1">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h2 className="font-display text-lg text-ink-900">{col.label}</h2>
                    <span className="font-mono-ui text-xs text-ink-300 ml-auto">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 min-h-[80px]">
                    {colTasks.length === 0 ? (
                      <div className="border border-dashed border-ink-100 rounded-lg py-8 text-center">
                        <p className="text-xs text-ink-300 font-mono-ui">Tidak ada task</p>
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={setEditingTask}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <TaskForm users={users} onSubmit={handleCreate} onClose={() => setShowForm(false)} />
      )}

      {editingTask && (
        <TaskForm
          task={editingTask}
          users={users}
          onSubmit={handleUpdate}
          onClose={() => setEditingTask(null)}
        />
      )}

      <ChatbotWidget />
    </main>
  );
}
