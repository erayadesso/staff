"use client";

import CalendarPageShell from "@/components/CalendarPageShell";
import type { CalendarRequestData } from "@/lib/calendar";

export default function CalendarView({ initialRequests }: { initialRequests: CalendarRequestData[] }) {
  return <CalendarPageShell initialRequests={initialRequests} />;
}
