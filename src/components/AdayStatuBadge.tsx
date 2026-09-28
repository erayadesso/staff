import { adayStatuAmblem, adayStatuRenk } from "@/lib/domain";

export default function AdayStatuBadge({
  surecDurumAdi,
  className = "",
}: {
  surecDurumAdi: string | null | undefined;
  className?: string;
}) {
  const renk = adayStatuRenk(surecDurumAdi);
  const amblem = adayStatuAmblem(surecDurumAdi);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${renk} ${className}`}
    >
      {amblem && <span aria-hidden>{amblem}</span>}
      {surecDurumAdi || "—"}
    </span>
  );
}
