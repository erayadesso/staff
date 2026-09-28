import { talepStatuAmblem, talepStatuRenk } from "@/lib/domain";

export default function TalepStatuBadge({
  durumAdi,
  className = "",
}: {
  durumAdi: string;
  className?: string;
}) {
  const renk =
    durumAdi === "Talep Karşılandı"
      ? "bg-emerald-600 text-white ring-emerald-600 dark:bg-emerald-500 dark:text-white dark:ring-emerald-500"
      : talepStatuRenk(durumAdi);

  const amblem = talepStatuAmblem(durumAdi);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${renk} ${className}`}
    >
      {amblem && <span aria-hidden>{amblem}</span>}
      {durumAdi || "—"}
    </span>
  );
}
