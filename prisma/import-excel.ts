import path from "node:path";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

/**
 * Excel'deki "🎯 Talep Listesi" sheet'inden talepleri içe aktarır.
 * Kullanım: npm run import:excel -- "<excel-dosya-yolu>"
 *
 * NOT: Yalnızca talepleri taşır (adaylar sonraki adımda).
 *  - Talep No korunur (unique).
 *  - Firma / İş Birimi yoksa otomatik oluşturulur.
 *  - Tarih, Excel serial number'dan çözülür.
 */
const prisma = new PrismaClient();

function excelSerialToDate(serial: unknown): Date | null {
  if (typeof serial !== "number" || Number.isNaN(serial) || serial <= 0) {
    return null;
  }
  // 25569 = 01/01/1970 (Excel epoch)
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
  const filePath =
    process.argv[2] ??
    path.resolve(
      __dirname,
      "../../../Outsource Talepleri.xlsx"
    );

  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.find((n: string) =>
    n.includes("Talep Listesi")
  );
  if (!sheetName) {
    console.error("'Talep Listesi' sheet'i bulunamadı.");
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: "",
  });

  // Başlık satırını atla
  let olusturulan = 0;
  let atlanan = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const talepNo = r[0];
    const firmaAd = String(r[1] ?? "").trim();
    const birimAd = String(r[2] ?? "").trim();
    const talepSahibi = String(r[3] ?? "").trim();
    const adayTuru = String(r[4] ?? "").trim();
    const adet = r[5];
    const notlar = String(r[6] ?? "").trim() || null;
    const durumAdi = String(r[7] ?? "").trim();
    const olusturmaTarihi = excelSerialToDate(r[9]);
    const deadline = excelSerialToDate(r[10]);
    const guncelNot = String(r[11] ?? "").trim() || null;

    // Talep no ve zorunlu alanlar boşsa atla
    if (!talepNo || !firmaAd || !birimAd || !talepSahibi || !adayTuru) {
      atlanan++;
      continue;
    }

    // Var olan talep no'yu atla (idempotent)
    const mevcut = await prisma.talep.findUnique({
      where: { talepNo: Number(talepNo) },
    });
    if (mevcut) {
      atlanan++;
      continue;
    }

    // Firma oluştur/getir
    const firma = await prisma.firma.upsert({
      where: { ad: firmaAd },
      update: {},
      create: { ad: firmaAd },
    });

    // İş birimi oluştur/getir
    const birim = await prisma.isBirimi.upsert({
      where: { firmaId_ad: { firmaId: firma.id, ad: birimAd } },
      update: {},
      create: { firmaId: firma.id, ad: birimAd },
    });

    await prisma.talep.create({
      data: {
        talepNo: Number(talepNo),
        talepSahibi,
        adayTuru,
        adet: adet ? String(adet).trim() : null,
        notlar,
        guncelNot,
        durumAdi,
        olusturulmaTarihi: olusturmaTarihi ?? new Date(),
        deadline,
        isBirimiId: birim.id,
        // Oluşturan: Excel'de isim var; User tablosunda eşleşmiyorsa boş bırakılır
      },
    });

    olusturulan++;
  }

  console.log(
    `İmport tamamlandı. Oluşturulan: ${olusturulan}, Atlanan: ${atlanan}`
  );
}

main()
  .catch((e) => {
    console.error("Import hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
