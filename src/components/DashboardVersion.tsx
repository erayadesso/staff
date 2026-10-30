"use client";

import ReleaseNotesModal from "./ReleaseNotesModal";
import { useCallback, useRef } from "react";

const APP_VERSION = process.env.NEXT_PUBLIC_VERSION || "1.6.0";
const FORCE_OPEN_KEY = "release_notes_force_open";

export default function DashboardVersion() {
  const modalRef = useRef<{ open(): void } | null>(null);

  const handleVersionClick = useCallback(() => {
    // Modal zaten açıksa tekrar aç — release notes'u yeniden göster
    localStorage.setItem(FORCE_OPEN_KEY, "true");
    window.location.reload();
  }, []);

  return (
    <>
      <ReleaseNotesModal />
      <div className="border-t border-zinc-100 py-3 text-center dark:border-zinc-800/50">
        <button
          onClick={handleVersionClick}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 px-3 py-1 text-[10px] font-medium text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          title="Release Notes için tıkla"
          aria-label="Versiyon bilgisi — Release Notes"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          v{APP_VERSION}
        </button>
      </div>
    </>
  );
}
