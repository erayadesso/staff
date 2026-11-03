"use client";

import { useCallback, useState } from "react";
import ReleaseNotesModal from "./ReleaseNotesModal";
import { useReleaseNote, isSeen } from "@/lib/release-notes-service";

const APP_VERSION = process.env.NEXT_PUBLIC_VERSION || "1.7.0";

export default function DashboardVersion() {
  const [modalOpen, setModalOpen] = useState(false);
  const { releaseNote, loading } = useReleaseNote();

  const handleVersionClick = useCallback(() => {
    // Zaten görülmüşse modal'ı açma
    if (releaseNote && isSeen(releaseNote.version)) {
      return;
    }
    setModalOpen(true);
  }, [releaseNote]);

  const handleClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <>
      <ReleaseNotesModal
        isOpen={modalOpen}
        onClose={handleClose}
        releaseNote={releaseNote}
        loading={loading}
      />
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
