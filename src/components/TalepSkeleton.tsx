export default function TalepSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-5 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="mt-2 h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1 h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mt-3 space-y-1">
        <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}
