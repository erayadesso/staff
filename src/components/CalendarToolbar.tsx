"use client";

import { AY_ISIMLERI } from "@/lib/calendar";

interface Props {
  currentMonth: { year: number; month: number };
  filters: { showDeadline: boolean; showAdesso: boolean; showCreated: boolean };
  onMonthChange: (month: { year: number; month: number }) => void;
  onFilterChange: (filters: { showDeadline: boolean; showAdesso: boolean; showCreated: boolean }) => void;
}

export default function CalendarToolbar({
  currentMonth,
  filters,
  onMonthChange,
  onFilterChange,
}: Props) {
  const oncekiAy = () => {
    let { year, month } = currentMonth;
    month--;
    if (month < 0) {
      month = 11;
      year--;
    }
    onMonthChange({ year, month });
  };

  const sonrakiAy = () => {
    let { year, month } = currentMonth;
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
    onMonthChange({ year, month });
  };

  const bugun = () => {
    const now = new Date();
    onMonthChange({ year: now.getFullYear(), month: now.getMonth() });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Sol: Ay navigasyonu */}
      <div className="flex items-center gap-3">
        <button
          onClick={oncekiAy}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Önceki ay"
        >
          ←
        </button>
        <span className="min-w-[140px] text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {AY_ISIMLERI[currentMonth.month]} {currentMonth.year}
        </span>
        <button
          onClick={sonrakiAy}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Sonraki ay"
        >
          →
        </button>
        <button
          onClick={bugun}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          Bugün
        </button>
      </div>

      {/* Orta: Filtreler */}
      <div className="flex items-center gap-2">
        <button
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            filters.showDeadline
              ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
          onClick={() =>
            onFilterChange({ ...filters, showDeadline: !filters.showDeadline })
          }
        >
          Deadline
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            filters.showAdesso
              ? "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
          onClick={() =>
            onFilterChange({ ...filters, showAdesso: !filters.showAdesso })
          }
        >
          Hedef
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            filters.showCreated
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
          onClick={() =>
            onFilterChange({ ...filters, showCreated: !filters.showCreated })
          }
        >
          Oluşturma
        </button>
      </div>
    </div>
  );
}
