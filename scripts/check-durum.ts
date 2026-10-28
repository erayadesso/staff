import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== RequestStatus ===");
  const talepDurumlari = await prisma.requestStatus.findMany({
    orderBy: { order: "asc" },
  });
  for (const td of talepDurumlari) {
    console.log(`  ${td.id} | ${td.name} | order: ${td.order} | ton: ${td.ton}`);
  }

  console.log("\n=== ProcessStatus ===");
  const surecDurumlari = await prisma.processStatus.findMany({
    orderBy: { order: "asc" },
  });
  for (const sd of surecDurumlari) {
    console.log(`  ${sd.id} | ${sd.name} | order: ${sd.order} | ton: ${sd.ton}`);
  }

  console.log("\n=== Talepler - durum dağılımı ===");
  const talepler = await prisma.request.findMany({
    select: { status: { select: { name: true } } },
  });
  const freq: Record<string, number> = {};
  for (const t of talepler) {
    const k = t.status?.name ?? "(null)";
    freq[k] = (freq[k] || 0) + 1;
  }
  Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  "${k}" → ${v} adet`));

  console.log("\n=== Talepler - örnekler ===");
  const ornekler = await prisma.request.findMany({
    select: { requestNo: true, status: { select: { name: true } } },
    take: 10,
  });
  for (const o of ornekler) {
    console.log(`  #${o.requestNo} → "${o.status?.name}"`);
  }
}

main().finally(() => prisma.$disconnect());
