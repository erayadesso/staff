import { prisma } from "./prisma";
import { talepDurumuBelirle } from "./domain";

/**
 * Talebin durumunu, bağlı adayların süreç durumlarının en ilerisine göre
 * otomatik günceller. En ileri aktif adayın süreç durumunun tonu, talep
 * durumuna eşlenir ve eşleşen TalepDurumu id'si yazılır.
 */
export async function talepDurumunuGuncelle(talepId: string): Promise<void> {
  const [adaylari, talepDurumlari] = await Promise.all([
    prisma.aday.findMany({
      where: { talepId },
      select: {
        surecDurum: { select: { id: true, ad: true, sira: true, ton: true } },
      },
    }),
    prisma.talepDurumu.findMany({
      select: { id: true, ad: true, sira: true, ton: true },
    }),
  ]);

  const varsayilan = talepDurumlari
    .filter((t) => t.ton === "yeni")
    .sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0))[0] ?? null;

  const yeniId = talepDurumuBelirle(
    adaylari.map((a) => a.surecDurum),
    talepDurumlari,
    varsayilan
  );

  await prisma.$transaction([
    prisma.talep.update({
      where: { id: talepId },
      data: { durumId: yeniId },
    }),
  ]);
}
