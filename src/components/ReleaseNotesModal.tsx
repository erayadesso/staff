"use client";

import { useEffect } from "react";

interface ReleaseNote {
  version: string;
  title: string;
  body: string;
  createdAt: string;
}

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseNote: ReleaseNote | null;
  loading: boolean;
}

export default function ReleaseNotesModal({
  isOpen,
  onClose,
  releaseNote,
  loading,
}: ReleaseNotesModalProps) {
  // ESC tuşu ile kapat
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  function handleClose() {
    onClose();
  }

  if (!isOpen || !releaseNote || loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={handleClose}>
      <div
        className="w-full max-w-lg animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal
        aria-label="Release Notes"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                  v{releaseNote.version}
                </span>
                <span className="text-xs text-zinc-400">
                  {new Date(releaseNote.createdAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {releaseNote.title}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label="Kapat"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
            <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
              {releaseNote.body.split("\n").map((line, i) => {
                if (line.trim() === "") return <br key={i} />;
                if (line.startsWith("- ")) {
                  return (
                    <div key={i} className="ml-4 flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                      <span>{line.slice(2)}</span>
                    </div>
                  );
                }
                if (/^\d+\./.test(line)) {
                  return (
                    <p key={i} className="font-medium text-zinc-800 dark:text-zinc-200">
                      {line}
                    </p>
                  );
                }
                return <p key={i}>{line}</p>;
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <button
              onClick={handleClose}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
