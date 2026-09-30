import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== TalepDurumu ===");
  const talepDurumlari = await prisma.talepDurumu.findMany({
    orderBy: { sira: "asc" },
  });
  for (const td of talepDurumlari) {
    console.log(`  ${td.id} | ${td.ad} | sira: ${td.sira} | ton: ${td.ton}`);
  }

  console.log("\n=== SurecDurumu ===");
  const surecDurumlari = await prisma.surecDurumu.findMany({
    orderBy: { sira: "asc" },
  });
  for (const sd of surecDurumlari) {
    console.log(`  ${sd.id} | ${sd.ad} | sira: ${sd.sira} | ton: ${sd.ton}`);
  }

  console.log("\n=== Talepler - durum dağılımı ===");
  const talepler = await prisma.talep.findMany({
    select: { durum: { select: { ad: true } } },
  });
  const freq: Record<string, number> = {};
  for (const t of talepler) {
    const k = t.durum?.ad ?? "(null)";
    freq[k] = (freq[k] || 0) + 1;
  }
  Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  "${k}" → ${v} adet`));

  console.log("\n=== Talepler - örnekler ===");
  const ornekler = await prisma.talep.findMany({
    select: { talepNo: true, durum: { select: { ad: true } } },
    take: 10,
  });
  for (const o of ornekler) {
    console.log(`  #${o.talepNo} → "${o.durum?.ad}"`);
  }
}

main().finally(() => prisma.$disconnect());
