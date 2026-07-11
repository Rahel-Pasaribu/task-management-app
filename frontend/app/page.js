"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const DEMO_ACCOUNTS = [
  { username: "admin", password: "admin123", label: "Admin" },
  { username: "budi", password: "budi123", label: "Budi" },
  { username: "sari", password: "sari123", label: "Sari" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      router.push("/tasks");
    } catch (err) {
      setError(err.message || "Login gagal");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
  };

  return (
    <main className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[46%] bg-ink-900 relative overflow-hidden flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(250,247,240,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(250,247,240,.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10">
          <span className="font-mono-ui text-xs tracking-[0.25em] text-amber-400 uppercase">
            Moonlay Technologies
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="font-mono-ui text-xs text-ink-300 tracking-widest uppercase mb-4">
            No. 004 — Task Ledger
          </p>
          <h1 className="font-display text-5xl leading-[1.08] text-paper mb-6">
            Setiap task,
            <br />
            <span className="italic text-amber-400">tercatat</span> rapi.
          </h1>
          <p className="text-ink-300 text-[15px] leading-relaxed">
            Kelola pekerjaan tim dari satu papan kerja: status jelas,
            deadline terpantau, penanggung jawab pasti.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-ink-300 text-xs font-mono-ui">
          <span>Todo</span>
          <span className="w-1 h-1 rounded-full bg-ink-300" />
          <span>In Progress</span>
          <span className="w-1 h-1 rounded-full bg-ink-300" />
          <span>Done</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-paper">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-mono-ui text-xs tracking-[0.25em] text-amber-600 uppercase">
              Moonlay Technologies
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl text-ink-900 mb-2">Masuk</h2>
            <p className="text-sm text-ink-500">
              Gunakan akun kerja Anda untuk membuka papan task.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-clay-600 bg-clay-50 rounded-md px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Memproses…" : "Masuk ke Papan Task"}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-ink-100">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2.5">
              Akun demo
            </p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => fillDemo(acc)}
                  type="button"
                  className="flex-1 text-xs font-mono-ui bg-white border border-ink-100 hover:border-amber-400 hover:bg-amber-50 rounded-md px-2 py-2 text-ink-700 transition-colors"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
