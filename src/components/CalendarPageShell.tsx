"use client";

import { useState } from "react";
import CalendarToolbar from "@/components/CalendarToolbar";
import CalendarGrid from "@/components/CalendarGrid";
import type { CalendarRequestData } from "@/lib/calendar";

export default function CalendarPageShell({ initialRequests }: { initialRequests: CalendarRequestData[] }) {
  const [filters, setFilters] = useState({
    showDeadline: true,
    showAdesso: true,
    showCreated: true,
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Filtreleme
  const visibleRequests = initialRequests.filter((req) => {
    if (req.primaryDate.type === "deadline" && !filters.showDeadline) return false;
    if (req.primaryDate.type === "adesso" && !filters.showAdesso) return false;
    if (req.primaryDate.type === "created" && !filters.showCreated) return false;
    return true;
  });

  // Sadece mevcut aya ait talepleri filtrele
  const monthRequests = visibleRequests.filter((req) => {
    const d = req.primaryDate.date;
    return (
      d.getFullYear() === currentMonth.year &&
      d.getMonth() === currentMonth.month
    );
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <CalendarToolbar
        currentMonth={currentMonth}
        filters={filters}
        onMonthChange={setCurrentMonth}
        onFilterChange={setFilters}
      />

      {/* Grid */}
      {monthRequests.length > 0 ? (
        <CalendarGrid requests={monthRequests} currentMonth={currentMonth} />
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {visibleRequests.length === 0
              ? "Seçili filtrelerle eşleşen talep bulunamadı."
              : "Bu aya ait talep bulunamadı."}
          </p>
        </div>
      )}
    </div>
  );
}
