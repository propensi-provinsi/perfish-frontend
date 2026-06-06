"use client";

import { FormEvent, useState } from "react";
import { Loader2, MessageSquareText, Send, X } from "lucide-react";
import {
  getChatbotErrorMessage,
  submitFeedback,
  type ChatbotUser,
} from "@/lib/chatbot-api";

interface FloatingFeedbackBotProps {
  user: ChatbotUser;
  leftClassName: string;
}

export default function FloatingFeedbackBot({
  user,
  leftClassName,
}: FloatingFeedbackBotProps) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function closeModal() {
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = feedback.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setInterpretation(null);

    try {
      const response = await submitFeedback({
        feedback: trimmed,
        user,
        current_path:
          typeof window !== "undefined" ? window.location.pathname : undefined,
      });
      setInterpretation(response.interpretation);
      setFeedback("");
    } catch (err) {
      setError(
        getChatbotErrorMessage(
          err,
          "Feedback belum bisa dikirim. Coba lagi nanti."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed bottom-4 z-50 grid size-14 place-items-center rounded-full bg-green text-white shadow-lg shadow-green/25 transition hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-green/25 sm:bottom-6 ${leftClassName}`}
        aria-label="Buka feedback"
        title="Feedback"
      >
        <MessageSquareText className="size-6" aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <section className="w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-dark-card">
            <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                  Feedback Aplikasi
                </h2>
                <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                  {user.email || user.name || "Pengguna PERFISH"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="grid size-8 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Tutup feedback"
                title="Tutup"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                maxLength={5000}
                rows={6}
                placeholder="Tulis bug, kendala, atau ide fitur..."
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-cyan focus:ring-2 focus:ring-cyan/20 dark:border-white/10 dark:bg-dark-section dark:text-gray-100"
              />

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                  {error}
                </div>
              )}

              {interpretation && (
                <div className="rounded-lg border border-green/30 bg-green-light px-3 py-2 text-sm text-gray-800 dark:border-green/40 dark:bg-green/10 dark:text-gray-100">
                  <p className="font-semibold">Interpretasi AI</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                    {interpretation}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={!feedback.trim() || loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="size-4" aria-hidden="true" />
                  )}
                  Kirim
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
