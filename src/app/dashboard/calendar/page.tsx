import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import CalendarView from "@/components/CalendarView";
import {
  getCardColorType,
  getDeadlineWarningClass,
  getFillRate,
  getPrimaryDate,
  type CalendarRequestData,
} from "@/lib/calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ showCancelled?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const params = await searchParams;
  const showCancelled = params.showCancelled === "true";

  const rawRequests = showCancelled
    ? await prisma.request.findMany({
        include: {
          department: {
            select: {
              name: true,
              company: { select: { name: true, logoUrl: true } },
            },
          },
          status: { select: { id: true, name: true, ton: true, order: true } },
          candidates: {
            select: {
              id: true,
              processStatus: { select: { id: true, name: true, ton: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      })
    : await prisma.request.findMany({
        include: {
          department: {
            select: {
              name: true,
              company: { select: { name: true, logoUrl: true } },
            },
          },
          status: { select: { id: true, name: true, ton: true, order: true } },
          candidates: {
            select: {
              id: true,
              processStatus: { select: { id: true, name: true, ton: true } },
            },
          },
        },
        where: {
          status: {
            is: {
              ton: { not: "kapandi" },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

  // İşleme: fill rate, primary date, color type
  const calendarRequests: CalendarRequestData[] = rawRequests.map((r) => {
    const primaryDate = getPrimaryDate(r.deadline, r.adessoDuration, r.createdAt);
    const colorType = getCardColorType(r.deadline, r.adessoDuration);
    return {
      id: r.id,
      requestNo: r.requestNo,
      candidateType: r.candidateType,
      deadline: r.deadline,
      adessoDuration: r.adessoDuration,
      createdAt: r.createdAt,
      department: r.department
        ? {
            name: r.department.name,
            company: {
              name: r.department.company.name,
              logoUrl: r.department.company.logoUrl,
            },
          }
        : undefined,
      status: r.status
        ? { name: r.status.name, ton: r.status.ton }
        : undefined,
      fillRate: getFillRate({ candidates: r.candidates, quantity: r.quantity }),
      primaryDate,
      colorType,
      deadlineWarning: getDeadlineWarningClass(r.deadline),
    };
  });

  return <CalendarView initialRequests={calendarRequests} />;
}
