import { prisma } from "./prisma";

export async function getRequests(showCancelled: boolean = false) {
  const aktifTalepTonlari = ["yeni", "ic", "dis", "gorsme", "secim", "kabul", "karsilandi"];

  return prisma.request.findMany({
    where: showCancelled ? undefined : {
      status: {
        ton: { in: aktifTalepTonlari },
      },
    },
    include: {
      department: {
        select: {
          name: true,
          companyId: true,
          company: { select: { name: true, logoUrl: true } },
        },
      },
      status: { select: { id: true, name: true, order: true, ton: true } },
      candidates: {
        select: {
          id: true,
          candidateName: true,
          processStatus: { select: { id: true, name: true, order: true, ton: true } },
        },
      },
    },
    orderBy: { requestNo: "desc" },
  });
}
