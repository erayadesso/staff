import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== TalepDurumu ===");
  const td = await prisma.talepDurumu.findMany({ orderBy: { sira: "asc" } });
  td.forEach((d) => console.log(`  "${d.ad}" (sira ${d.sira}, ton ${d.ton})`));

  console.log("\n=== SurecDurumu ===");
  const sd = await prisma.surecDurumu.findMany({ orderBy: { sira: "asc" } });
  sd.forEach((d) => console.log(`  "${d.ad}" (sira ${d.sira}, ton ${d.ton})`));

  console.log("\n=== Taleplerde kullanilan durum degerleri ===");
  const talepler = await prisma.talep.findMany({
    select: { durum: { select: { ad: true } } },
  });
  const freq: Record<string, number> = {};
  talepler.forEach((t) => {
    const k = t.durum?.ad ?? "(null)";
    freq[k] = (freq[k] || 0) + 1;
  });
  Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  "${k}": ${v} talep`));

  console.log("\n=== Adaylarda kullanilan surecDurum degerleri ===");
  const adaylar = await prisma.aday.findMany({
    select: { surecDurum: { select: { ad: true } } },
  });
  const afreq: Record<string, number> = {};
  adaylar.forEach((a) => {
    const k = a.surecDurum?.ad ?? "(null)";
    afreq[k] = (afreq[k] || 0) + 1;
  });
  Object.entries(afreq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  "${k}": ${v} aday`));
}

main().catch(console.error).finally(() => process.exit());
