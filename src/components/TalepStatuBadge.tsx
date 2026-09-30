import { talepStatuAmblem, talepStatuRenk, type StatuNesne } from "@/lib/domain";

export default function TalepStatuBadge({
  durum,
  className = "",
}: {
  durum: StatuNesne | null | undefined;
  className?: string;
}) {
  const renk =
    durum?.ton === "karsilandi"
      ? "bg-emerald-600 text-white ring-emerald-600 dark:bg-emerald-500 dark:text-white dark:ring-emerald-500"
      : talepStatuRenk(durum);

  const amblem = talepStatuAmblem(durum);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${renk} ${className}`}
    >
      {amblem && <span aria-hidden>{amblem}</span>}
      {durum?.ad || "—"}
    </span>
  );
}
