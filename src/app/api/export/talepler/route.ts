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

  const requests = await prisma.request.findMany({
    include: {
      department: { include: { company: true } },
      status: { select: { name: true, ton: true } },
      candidates: { include: { processStatus: { select: { name: true, ton: true } } } },
    },
    orderBy: { requestNo: "asc" },
  });

  const satirlar: string[][] = [
    ["Talep No", "Firma", "İş Birimi", "Talep Sahibi", "Aday Türü", "Adet",
     "Durum", "Açık mı?", "Aday Sayısı", "Oluşturulma", "Müşteri Son Geçerlilik", "adesso Süresi", "Güncel Not"],
  ];

  for (const r of requests) {
    const acik = !isKapaliDurum(r.status) ? "Açık" : "Kapalı";
    satirlar.push([
      String(r.requestNo),
      r.department.company.name,
      r.department.name,
      r.requestOwner,
      r.candidateType,
      r.quantity ?? "",
      r.status?.name ?? "",
      acik,
      String(r.candidates.length),
      r.createdAt
        ? new Date(r.createdAt).toLocaleDateString("tr-TR")
        : "",
      r.deadline
        ? new Date(r.deadline).toLocaleDateString("tr-TR")
        : "",
      r.adessoDuration
        ? new Date(r.adessoDuration).toLocaleDateString("tr-TR")
        : "",
      r.currentNote ?? "",
    ]);
  }

  // Aday detayı ayrı bölüm
  satirlar.push([]);
  satirlar.push([
    "Talep No", "Firma", "Aday", "Domain", "Source", "Süreç Durumu", "Aday Cost", "İşe Başlama",
  ]);
  for (const r of requests) {
    for (const a of r.candidates) {
      satirlar.push([
        String(r.requestNo),
        r.department.company.name,
        a.candidateName,
        a.domain ?? "",
        a.source ?? "",
        a.processStatus?.name ?? "",
        a.cost ?? "",
        a.startDate
          ? new Date(a.startDate).toLocaleDateString("tr-TR")
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
