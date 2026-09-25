import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== TalepDurumu ===");
  const td = await prisma.talepDurumu.findMany({ orderBy: { sira: "asc" } });
  td.forEach((d) => console.log(`  "${d.ad}" (sira ${d.sira})`));

  console.log("\n=== SurecDurumu ===");
  const sd = await prisma.surecDurumu.findMany({ orderBy: { sira: "asc" } });
  sd.forEach((d) => console.log(`  "${d.ad}" (sira ${d.sira})`));

  console.log("\n=== Taleplerde kullanilan durumAdi degerleri ===");
  const talepler = await prisma.talep.findMany({ select: { durumAdi: true } });
  const freq: Record<string, number> = {};
  talepler.forEach((t) => {
    freq[t.durumAdi] = (freq[t.durumAdi] || 0) + 1;
  });
  Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  "${k}": ${v} talep`));

  console.log("\n=== Adaylarda kullanilan surecDurumAdi degerleri ===");
  const adaylar = await prisma.aday.findMany({ select: { surecDurumAdi: true } });
  const afreq: Record<string, number> = {};
  adaylar.forEach((a) => {
    const k = a.surecDurumAdi ?? "(null)";
    afreq[k] = (afreq[k] || 0) + 1;
  });
  Object.entries(afreq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  "${k}": ${v} aday`));
}

main().catch(console.error).finally(() => process.exit());
