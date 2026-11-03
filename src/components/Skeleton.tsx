"use client";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800 ${className ?? ""}`}
    />
  );
}

export function SkeletonText({
  lines = 1,
  width = "full",
}: {
  lines?: number;
  width?: string;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={i === lines - 1 ? (width ?? "w-3/4") : "w-full"}
        />
      ))}
    </div>
  );
}
