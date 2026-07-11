"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

const SUGGESTIONS = [
  "Task belum selesai?",
  "Berapa yang sudah Done?",
  "Deadline hari ini?",
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hai! Tanyakan apa saja seputar data task kamu." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (question) => {
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.chatbotQuery(question);
      setMessages((prev) => [...prev, { role: "bot", text: res.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `Maaf, terjadi kesalahan: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div className="card shadow-panel w-[340px] h-[420px] mb-3 flex flex-col overflow-hidden">
          <div className="bg-ink-900 text-paper px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="font-mono-ui text-[10px] uppercase tracking-widest text-amber-400">
                Bonus feature
              </p>
              <span className="font-display text-[15px]">Task Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-ink-300 hover:text-paper text-lg">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-sm kanban-scroll bg-ink-50/40">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-lg whitespace-pre-line text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-ink-900 text-paper ml-auto rounded-br-sm"
                    : "bg-white text-ink-700 border border-ink-100 rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-ink-300 font-mono-ui px-1">sedang mengetik…</div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-2.5 border-t border-ink-100 bg-white">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[10px] font-mono-ui bg-ink-50 hover:bg-amber-50 hover:text-amber-700 rounded-full px-2.5 py-1 text-ink-500 border border-ink-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2"
            >
              <input
                className="input text-sm py-2"
                placeholder="Tulis pertanyaan…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className="btn-primary text-sm px-3 py-2">
                Kirim
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-ink-900 hover:bg-ink-700 text-amber-400 shadow-panel flex items-center justify-center text-xl transition-colors"
        title="AI Task Assistant"
      >
        {open ? "✕" : "✦"}
      </button>
    </div>
  );
}
