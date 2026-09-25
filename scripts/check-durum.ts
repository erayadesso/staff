import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== TalepDurumu ===");
  const talepDurumlari = await prisma.talepDurumu.findMany({ orderBy: { sira: "asc" } });
  for (const td of talepDurumlari) {
    console.log(`  ${td.id} | ${td.ad} | sira: ${td.sira}`);
  }

  console.log("\n=== SurecDurumu ===");
  const surecDurumlari = await prisma.surecDurumu.findMany({ orderBy: { sira: "asc" } });
  for (const sd of surecDurumlari) {
    console.log(`  ${sd.id} | ${sd.ad} | sira: ${sd.sira}`);
  }

  console.log("\n=== Talepler - durumAdi dağılımı ===");
  const talepler = await prisma.talep.groupBy({
    by: ["durumAdi"],
    _count: { durumAdi: true },
  });
  for (const t of talepler) {
    console.log(`  "${t.durumAdi}" → ${t._count.durumAdi} adet`);
  }

  console.log("\n=== Talepler - durumAdi örnekleri ===");
  const ornekler = await prisma.talep.findMany({
    select: { talepNo: true, durumAdi: true },
    take: 10,
  });
  for (const o of ornekler) {
    console.log(`  #${o.talepNo} → "${o.durumAdi}"`);
  }
}

main().finally(() => prisma.$disconnect());
