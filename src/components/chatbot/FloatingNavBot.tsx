"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import {
  getChatbotErrorMessage,
  sendChatMessage,
  type ChatHistoryMessage,
  type ChatbotUser,
} from "@/lib/chatbot-api";

interface FloatingNavBotProps {
  user: ChatbotUser;
}

interface UiMessage extends ChatHistoryMessage {
  id: string;
}

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function FloatingNavBot({ user }: FloatingNavBotProps) {
  const [open, setOpen] = useState(false);
  const [sessionId] = useState(createSessionId);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Halo, saya bisa membantu navigasi PERFISH.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    const userMessage: UiMessage = {
      id: createSessionId(),
      role: "user",
      content: trimmed,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setMessage("");
    setError(null);
    setLoading(true);

    try {
      const response = await sendChatMessage({
        message: trimmed,
        session_id: sessionId,
        user,
        history: messages
          .filter((item) => item.id !== "welcome")
          .slice(-8)
          .map(({ role, content }) => ({ role, content })),
        current_path:
          typeof window !== "undefined" ? window.location.pathname : undefined,
      });

      setMessages([
        ...nextMessages,
        {
          id: createSessionId(),
          role: "assistant",
          content: response.reply,
        },
      ]);
    } catch (err) {
      setError(
        getChatbotErrorMessage(
          err,
          "Chatbot belum bisa dihubungi. Coba lagi nanti."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <section className="mb-3 flex h-[min(70dvh,34rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-dark-card">
          <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-white/10">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan text-white">
                <Bot className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Asisten Navigasi
                </h2>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  PERFISH
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-8 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Tutup asisten navigasi"
              title="Tutup"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`flex ${
                  item.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    item.role === "user"
                      ? "bg-cyan text-white"
                      : "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100"
                  }`}
                >
                  {item.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:bg-white/10 dark:text-gray-300">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Memproses
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {error && (
            <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 border-t border-gray-200 p-3 dark:border-white/10"
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={4000}
              placeholder="Tanya lokasi menu..."
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-cyan focus:ring-2 focus:ring-cyan/20 dark:border-white/10 dark:bg-dark-section dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={!message.trim() || loading}
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-cyan text-white transition hover:bg-cyan-hover disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Kirim pesan"
              title="Kirim"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid size-14 place-items-center rounded-full bg-cyan text-white shadow-lg shadow-cyan/30 transition hover:bg-cyan-hover focus:outline-none focus:ring-4 focus:ring-cyan/25"
        aria-label="Buka asisten navigasi"
        title="Asisten navigasi"
      >
        {open ? (
          <X className="size-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="size-6" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
