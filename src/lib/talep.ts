import { prisma } from "./prisma";

export async function getTalepler(showCancelled: boolean = false) {
  const aktifTalepTonlari = ["yeni", "ic", "dis", "gorsme", "secim", "kabul", "karsilandi"];

  return prisma.talep.findMany({
    where: showCancelled ? undefined : {
      durum: {
        ton: { in: aktifTalepTonlari },
      },
    },
    include: {
      isBirimi: {
        select: {
          ad: true,
          firmaId: true,
          firma: { select: { ad: true, logoUrl: true } },
        },
      },
      durum: { select: { id: true, ad: true, sira: true, ton: true } },
      adaylar: {
        select: {
          id: true,
          adayAdi: true,
          surecDurum: { select: { id: true, ad: true, sira: true, ton: true } },
        },
      },
    },
    orderBy: { talepNo: "desc" },
  });
}
