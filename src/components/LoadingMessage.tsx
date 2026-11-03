"use client";

export default function LoadingMessage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"
      />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Veriler yükleniyor...
      </p>
    </div>
  );
}
