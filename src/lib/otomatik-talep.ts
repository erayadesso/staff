import { prisma } from "./prisma";
import { talepDurumuBelirle } from "./domain";

/**
 * Talebin durumunu, bağlı adayların süreç durumlarının en ilerisine göre
 * otomatik günceller. En ileri aktif adayın süreç durumunun tonu, talep
 * durumuna eşlenir ve eşleşen RequestStatus id'si yazılır.
 */
export async function talepDurumunuGuncelle(requestId: string): Promise<void> {
  const [adaylari, talepDurumlari] = await Promise.all([
    prisma.candidate.findMany({
      where: { requestId },
      select: {
        processStatus: { select: { id: true, name: true, order: true, ton: true } },
      },
    }),
    prisma.requestStatus.findMany({
      select: { id: true, name: true, order: true, ton: true },
    }),
  ]);

  const varsayilan = talepDurumlari
    .filter((t) => t.ton === "yeni")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0] ?? null;

  const yeniId = talepDurumuBelirle(
    adaylari.map((a) => a.processStatus),
    talepDurumlari,
    varsayilan
  );

  await prisma.$transaction([
    prisma.request.update({
      where: { id: requestId },
      data: { statusId: yeniId },
    }),
  ]);
}
