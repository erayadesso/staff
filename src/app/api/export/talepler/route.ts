import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { isKapaliDurum } from "@/lib/domain";

function csvEscape(v: string | null | undefined): string {
  const s = v ?? "";
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  const talepler = await prisma.talep.findMany({
    include: {
      isBirimi: { include: { firma: true } },
      durum: { select: { ad: true, ton: true } },
      adaylar: { include: { surecDurum: { select: { ad: true, ton: true } } } },
    },
    orderBy: { talepNo: "asc" },
  });

  const satirlar: string[][] = [
    ["Talep No", "Firma", "İş Birimi", "Talep Sahibi", "Aday Türü", "Adet",
     "Durum", "Açık mı?", "Aday Sayısı", "Oluşturulma", "Müşteri Son Geçerlilik", "adesso Süresi", "Güncel Not"],
  ];

  for (const t of talepler) {
    const acik = !isKapaliDurum(t.durum) ? "Açık" : "Kapalı";
    satirlar.push([
      String(t.talepNo),
      t.isBirimi.firma.ad,
      t.isBirimi.ad,
      t.talepSahibi,
      t.adayTuru,
      t.adet ?? "",
      t.durum?.ad ?? "",
      acik,
      String(t.adaylar.length),
      t.olusturulmaTarihi
        ? new Date(t.olusturulmaTarihi).toLocaleDateString("tr-TR")
        : "",
      t.deadline
        ? new Date(t.deadline).toLocaleDateString("tr-TR")
        : "",
      t.adessoSuresi
        ? new Date(t.adessoSuresi).toLocaleDateString("tr-TR")
        : "",
      t.guncelNot ?? "",
    ]);
  }

  // Aday detayı ayrı bölüm
  satirlar.push([]);
  satirlar.push([
    "Talep No", "Firma", "Aday", "Domain", "Source", "Süreç Durumu", "Aday Cost", "İşe Başlama",
  ]);
  for (const t of talepler) {
    for (const a of t.adaylar) {
      satirlar.push([
        String(t.talepNo),
        t.isBirimi.firma.ad,
        a.adayAdi,
        a.domain ?? "",
        a.source ?? "",
        a.surecDurum?.ad ?? "",
        a.adayCost ?? "",
        a.iseBaslamaTarihi
          ? new Date(a.iseBaslamaTarihi).toLocaleDateString("tr-TR")
          : "",
      ]);
    }
  }

  const csv = "\uFEFF" + satirlar.map((r) => r.map(csvEscape).join(";")).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="outsource-rapor-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
