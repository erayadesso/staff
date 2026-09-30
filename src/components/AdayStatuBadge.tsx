import { adayStatuAmblem, adayStatuRenk, type StatuNesne } from "@/lib/domain";

export default function AdayStatuBadge({
  durum,
  className = "",
}: {
  durum: StatuNesne | null | undefined;
  className?: string;
}) {
  const renk = adayStatuRenk(durum);
  const amblem = adayStatuAmblem(durum);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${renk} ${className}`}
    >
      {amblem && <span aria-hidden>{amblem}</span>}
      {durum?.ad || "—"}
    </span>
  );
}
