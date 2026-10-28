import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== RequestStatus ===");
  const td = await prisma.requestStatus.findMany({ orderBy: { order: "asc" } });
  td.forEach((d) => console.log(`  "${d.name}" (order ${d.order}, ton ${d.ton})`));

  console.log("\n=== ProcessStatus ===");
  const sd = await prisma.processStatus.findMany({ orderBy: { order: "asc" } });
  sd.forEach((d) => console.log(`  "${d.name}" (order ${d.order}, ton ${d.ton})`));

  console.log("\n=== Taleplerde kullanilan durum degerleri ===");
  const talepler = await prisma.request.findMany({
    select: { status: { select: { name: true } } },
  });
  const freq: Record<string, number> = {};
  talepler.forEach((t) => {
    const k = t.status?.name ?? "(null)";
    freq[k] = (freq[k] || 0) + 1;
  });
  Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  "${k}": ${v} talep`));

  console.log("\n=== Adaylarda kullanilan surecDurum degerleri ===");
  const adaylar = await prisma.candidate.findMany({
    select: { processStatus: { select: { name: true } } },
  });
  const afreq: Record<string, number> = {};
  adaylar.forEach((a) => {
    const k = a.processStatus?.name ?? "(null)";
    afreq[k] = (afreq[k] || 0) + 1;
  });
  Object.entries(afreq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  "${k}": ${v} aday`));
}

main().catch(console.error).finally(() => process.exit());
