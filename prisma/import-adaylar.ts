import path from "node:path";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

/**
 * Excel'deki şirket sheet'lerinden adayları içe aktarır.
 * Kullanım: npm run import:adaylar -- "<excel-dosya-yolu>"
 *
 * Strateji:
 *  - Talep No'su net olan adaylar (KFT, Shell, Opet, Hansgrohe) talebe bağlanır.
 *  - Talep bağlantısı olmayan adaylar "bağlantısız" olarak (firmaAd ile) eklenir;
 *    kullanıcı arayüzden talebe bağlayabilir.
 */

const prisma = new PrismaClient();

interface SheetConf {
  no: number | null; // Talep No sütun index'i (yoksa null)
  aday: number;
  domain: number;
  detay: number;
  source: number;
  durum: number;
  cost: number;
  iseBas: number | null;
}

// Sheet adı (boşluğa dikkat: "KFT ") -> sütun konfigürasyonu
const CONF: Record<string, SheetConf> = {
  "KFT ": { no: 3, aday: 5, domain: 0, detay: 4, source: 6, durum: 7, cost: 8, iseBas: null },
  Shell: { no: 2, aday: 4, domain: 0, detay: 3, source: 5, durum: 6, cost: 7, iseBas: 8 },
  Opet: { no: 2, aday: 3, domain: 0, detay: 3, source: 5, durum: 6, cost: 7, iseBas: null },
  Hansgrohe: { no: 1, aday: 4, domain: 0, detay: 3, source: 5, durum: 6, cost: 7, iseBas: null },
  // Bağlantısız sheet'ler (talep no yok)
  "KFT Remote": { no: null, aday: 3, domain: 0, detay: 2, source: 4, durum: 5, cost: 6, iseBas: null },
  N11: { no: null, aday: 3, domain: 0, detay: 2, source: 4, durum: 5, cost: 6, iseBas: null },
  Eurail: { no: null, aday: 3, domain: 0, detay: 2, source: 4, durum: 5, cost: 6, iseBas: null },
  chainiq: { no: null, aday: 3, domain: 0, detay: 2, source: 4, durum: 5, cost: 6, iseBas: null },
  "Aktech (PLSQL)-hold": { no: null, aday: 3, domain: 0, detay: 2, source: 4, durum: 5, cost: 6, iseBas: null },
  Yıldıztech: { no: null, aday: 3, domain: 0, detay: 2, source: 4, durum: 5, cost: 6, iseBas: null },
  Edenred: { no: null, aday: 3, domain: 0, detay: 2, source: 4, durum: 5, cost: 6, iseBas: null },
  "ING Bank": { no: null, aday: 3, domain: 0, detay: 2, source: 4, durum: 5, cost: 6, iseBas: null },
};

// Sheet adı -> bağlantısızlarda firma adı
function firmaAdiIcın(sheetAd: string): string {
  if (sheetAd.startsWith("KFT")) return "KFT";
  return sheetAd.replace(/\s*\(.*\)$/, "").trim();
}

function stringVeyaNull(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function parseDate(v: unknown): Date | null {
  if (typeof v === "number" || (typeof v === "string" && /^\d+$/.test(v))) {
    const num = typeof v === "number" ? v : parseFloat(v);
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

async function main() {
  const filePath =
    process.argv[2] ??
    path.resolve(__dirname, "../../../Outsource Talepleri.xlsx");
  const wb = XLSX.readFile(filePath);

  // Talep No -> id haritası (net bağlantı için)
  const talepler = await prisma.talep.findMany({ select: { id: true, talepNo: true } });
  const talepByNo = new Map(talepler.map((t) => [t.talepNo, t.id]));

  let baglanti = 0;
  let baglantisiz = 0;

  for (const [sheetAd, c] of Object.entries(CONF)) {
    const ws = wb.Sheets[sheetAd];
    if (!ws) {
      console.log(`  (sheet yok: ${sheetAd})`);
      continue;
    }
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: true,
      defval: "",
    });

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const adayAdi = stringVeyaNull(r[c.aday]);
      if (!adayAdi) continue; // boş satır

      const talepNoRaw = c.no !== null ? stringVeyaNull(r[c.no]) : null;
      const talepNo = talepNoRaw ? Number(talepNoRaw) : NaN;

      const data = {
        adayAdi,
        domain: stringVeyaNull(r[c.domain]),
        talepDetaylari: stringVeyaNull(r[c.detay]),
        source: stringVeyaNull(r[c.source]),
        surecDurumAdi: stringVeyaNull(r[c.durum]),
        adayCost: stringVeyaNull(r[c.cost]),
        iseBaslamaTarihi: c.iseBas !== null ? parseDate(r[c.iseBas]) : null,
      };

      // Net bağlantı: talep no tabloda mevcut mu?
      const talepId = !Number.isNaN(talepNo) ? talepByNo.get(talepNo) : undefined;

      if (talepId) {
        await prisma.aday.create({ data: { ...data, talepId } });
        baglanti++;
      } else {
        await prisma.aday.create({
          data: { ...data, talepId: null, firmaAd: firmaAdiIcın(sheetAd) },
        });
        baglantisiz++;
      }
    }
  }

  console.log(`Aday import tamamlandı. Talebe bağlanan: ${baglanti}, Bağlantısız: ${baglantisiz}`);
}

main()
  .catch((e) => {
    console.error("Import hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
