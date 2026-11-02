"use client";

import Link from "next/link";
import {
  getCardBorderClass,
  getCardDotClass,
  formatTRDate,
  type CardColorType,
} from "@/lib/calendar";

interface CalendarRequest {
  id: string;
  requestNo: number;
  candidateType: string;
  deadline: Date | null;
  adessoDuration: Date | null;
  createdAt: Date;
  fillRate: number | null;
  primaryDate: { date: Date; type: "deadline" | "adesso" | "created" };
  colorType: CardColorType;
  deadlineWarning: string;
  department?: {
    name: string;
    company: { name: string; logoUrl: string | null };
  };
  status?: { name: string };
}

export default function CalendarCard({ request }: { request: CalendarRequest }) {
  const borderClass = getCardBorderClass(request.colorType);
  const dotClass = getCardDotClass(request.colorType);

  const tarihMetni = request.primaryDate.type === "deadline"
    ? formatTRDate(request.deadline)
    : request.primaryDate.type === "adesso"
    ? formatTRDate(request.adessoDuration)
    : formatTRDate(request.createdAt);

  return (
    <Link
      href={`/dashboard/requests/${request.id}`}
      className={`block overflow-hidden rounded-lg border border-zinc-200 bg-white transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border-zinc-700 dark:bg-zinc-900 ${borderClass} ${request.deadlineWarning}`}
    >
      <div className="px-2.5 py-2">
        {/* Başlık */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              #{request.requestNo} {request.candidateType}
            </p>
            <p className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
              {request.department?.company?.name}
            </p>
          </div>
          <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
        </div>

        {/* Doluluk */}
        {request.fillRate !== null && request.fillRate !== undefined && (
          <div className="mt-1.5">
            <div className="flex items-center justify-between">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full ${
                    request.fillRate >= 100
                      ? "bg-emerald-500"
                      : request.fillRate >= 50
                      ? "bg-blue-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${request.fillRate}%` }}
                />
              </div>
              <span className="ml-1.5 shrink-0 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                %{request.fillRate}
              </span>
            </div>
          </div>
        )}

        {/* Tarih etiketi */}
        <p className="mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
          {tarihMetni}
        </p>

        {/* 3 tarih özeti */}
        <div className="mt-1 space-y-0.5">
          {request.deadline && (
            <p className="text-[9px] text-red-500 dark:text-red-400">
              DL: {formatTRDate(request.deadline)}
            </p>
          )}
          {request.adessoDuration && (
            <p className="text-[9px] text-orange-500 dark:text-orange-400">
              HG: {formatTRDate(request.adessoDuration)}
            </p>
          )}
          {request.status?.name && (
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500">
              {request.status.name}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
