"use client";

import { useMemo } from "react";
import CalendarCard from "@/components/CalendarCard";
import { getMonthInfo, HAFTA_ICIM } from "@/lib/calendar";

interface CalendarRequest {
  id: string;
  requestNo: number;
  candidateType: string;
  deadline: Date | null;
  adessoDuration: Date | null;
  createdAt: Date;
  fillRate: number | null;
  primaryDate: { date: Date; type: "deadline" | "adesso" | "created" };
  colorType: "red" | "orange" | "blue";
  deadlineWarning: string;
  department?: {
    name: string;
    company: { name: string; logoUrl: string | null };
  };
  status?: { name: string };
}

interface Props {
  requests: CalendarRequest[];
  currentMonth: { year: number; month: number };
}

export default function CalendarGrid({ requests, currentMonth }: Props) {
  const grid = useMemo(() => {
    const { daysInMonth, startDayOfWeek } = getMonthInfo(
      currentMonth.year,
      currentMonth.month
    );

    // Pazartesi başlangıç için düzenle (0=Paz → 6)
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const cells: Array<{
      day: number;
      isCurrentMonth: boolean;
      dayRequests: CalendarRequest[];
    }> = [];

    // Önceki ayın boş günleri
    const prevMonthLast = new Date(currentMonth.year, currentMonth.month, 0).getDate();
    for (let i = adjustedStart - 1; i >= 0; i--) {
      cells.push({
        day: prevMonthLast - i,
        isCurrentMonth: false,
        dayRequests: [],
      });
    }

    // Mevcut ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.year, currentMonth.month, day);
      const dayRequests = requests.filter((r) => {
        const d = r.primaryDate.date;
        return (
          d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === day
        );
      });
      cells.push({ day, isCurrentMonth: true, dayRequests });
    }

    // Sonraki ayın boş günleri (grid'i 6 hafta = 42 hücreye tamamla)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        day: i,
        isCurrentMonth: false,
        dayRequests: [],
      });
    }

    return cells;
  }, [currentMonth, requests]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Hafta isimleri */}
      <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
        {HAFTA_ICIM.map((gun) => (
          <div
            key={gun}
            className="px-2 py-3 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400"
          >
            {gun}
          </div>
        ))}
      </div>

      {/* Gün grid */}
      <div className="grid grid-cols-7">
        {grid.map((cell, idx) => (
          <div
            key={idx}
            className={`min-h-[140px] border-b border-r border-zinc-100 p-2 dark:border-zinc-800/60 ${
              !cell.isCurrentMonth
                ? "bg-zinc-50/50 dark:bg-zinc-900/20"
                : ""
            }`}
          >
            {/* Gün numarası */}
            <div className="mb-1 flex items-center justify-end">
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  cell.isCurrentMonth
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {cell.day}
              </span>
            </div>

            {/* Talep kartları */}
            <div className="space-y-1">
              {cell.dayRequests.map((req) => (
                <CalendarCard key={req.id} request={req} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
