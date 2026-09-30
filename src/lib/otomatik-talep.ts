import { prisma } from "./prisma";
import { talepDurumuBelirle } from "./domain";

/**
 * Talebin durumunu, bağlı adayların süreç durumlarının en ilerisine göre
 * otomatik günceller. En ileri aktif adayın süreç durumunun tonu, talep
 * durumuna eşlenir ve eşleşen TalepDurumu id'si yazılır.
 */
export async function talepDurumunuGuncelle(talepId: string): Promise<void> {
  const [adaylari, talepDurumlari, varsayilan] = await Promise.all([
    prisma.aday.findMany({
      where: { talepId },
      select: {
        surecDurum: { select: { id: true, ad: true, sira: true, ton: true } },
      },
    }),
    prisma.talepDurumu.findMany({
      select: { id: true, ad: true, sira: true, ton: true },
    }),
    prisma.talepDurumu.findFirst({
      where: { ton: "yeni" },
      orderBy: { sira: "asc" },
      select: { id: true, ad: true, sira: true, ton: true },
    }),
  ]);

  const yeniId = talepDurumuBelirle(
    adaylari.map((a) => a.surecDurum),
    talepDurumlari,
    varsayilan
  );

  await prisma.talep.update({
    where: { id: talepId },
    data: { durumId: yeniId },
  });
}
