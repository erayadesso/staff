/**
 * Takvim yardımcı fonksiyonları
 */

// ——— Ay bilgisi ———

export function getMonthInfo(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return {
    daysInMonth: lastDay.getDate(),
    startDayOfWeek: firstDay.getDay(), // 0 = Pazar
  };
}

// ——— Tarih formatlama ———

export function formatTRDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ——— Kart tipi belirleme ———

export type CardColorType = "red" | "orange" | "blue";
export type PrimaryDateType = "deadline" | "adesso" | "created";

export function getCardColorType(deadline: Date | null | undefined, adessoDuration: Date | null | undefined): CardColorType {
  if (deadline) return "red";
  if (adessoDuration) return "orange";
  return "blue";
}

export function getCardBorderClass(type: CardColorType): string {
  switch (type) {
    case "red":
      return "border-l-4 border-l-red-500 dark:border-l-red-400";
    case "orange":
      return "border-l-4 border-l-orange-500 dark:border-l-orange-400";
    case "blue":
      return "border-l-4 border-l-blue-500 dark:border-l-blue-400";
  }
}

export function getCardDotClass(type: CardColorType): string {
  switch (type) {
    case "red":
      return "bg-red-500";
    case "orange":
      return "bg-orange-500";
    case "blue":
      return "bg-blue-500";
  }
}

// ——— Kartın takvimdeki konumu ———

export function getPrimaryDate(deadline: Date | null | undefined, adessoDuration: Date | null | undefined, createdAt: Date): { date: Date; type: PrimaryDateType } {
  if (deadline) return { date: new Date(deadline), type: "deadline" };
  if (adessoDuration) return { date: new Date(adessoDuration), type: "adesso" };
  return { date: new Date(createdAt), type: "created" };
}

// ——— Deadline uyarısı ———

export function getDeadlineWarningClass(deadline: Date | null | undefined): string {
  if (!deadline) return "";
  const now = new Date();
  const dl = new Date(deadline);
  const diff = (dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "bg-red-50/50 dark:bg-red-950/20";
  if (diff <= 7) return "bg-amber-50/50 dark:bg-amber-950/20";
  return "";
}

// ——— Doluluk oranı ———

export function getFillRate(request: { candidates: Array<{ processStatus?: { ton: string } | null }>; quantity: string | null }): number | null {
  const hedef = parseInt(request.quantity || "0", 10);
  if (hedef <= 0) return null;
  const basariylaKapanan = request.candidates.filter(
    (c) => c.processStatus?.ton === "karsilandi"
  ).length;
  return Math.min(Math.round((basariylaKapanan / hedef) * 100), 100);
}

// ——— Ay adları ———

export const AY_ISIMLERI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export const HAFTA_ICIM = ["Pzt", "Salı", "Çarş", "Per", "Cum", "Cmt", "Paz"];

// ——— Tip tanımları ———

export interface CalendarRequestData {
  id: string;
  requestNo: number;
  candidateType: string;
  deadline: Date | null;
  adessoDuration: Date | null;
  createdAt: Date;
  fillRate: number | null;
  primaryDate: { date: Date; type: PrimaryDateType };
  colorType: CardColorType;
  deadlineWarning: string;
  department?: {
    name: string;
    company: { name: string; logoUrl: string | null };
  };
  status?: { name: string; ton: string };
}
