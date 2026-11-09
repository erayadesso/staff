import { prisma } from "./prisma";

export async function getRequests(showCancelled: boolean = false) {
  // Yeni sistem: sadece "aktif" ton aktif kabul edilir
  // Backward compatibility: eski tonlar da aktif kabul edilir
  const aktifTonlar = ["aktif", "yeni", "ic", "dis", "gorsme", "secim", "kabul"];

  return prisma.request.findMany({
    where: showCancelled ? undefined : {
      status: {
        ton: { in: aktifTonlar },
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
