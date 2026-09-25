import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { talepDurumuBelirle } from "@/lib/domain";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  let body: {
    talepId?: string;
    adayAdi?: string;
    domain?: string;
    talepDetaylari?: string;
    source?: string;
    surecDurumAdi?: string;
    adayCost?: string;
    iseBaslamaTarihi?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const adayAdi = body.adayAdi?.trim();
  if (!adayAdi || !body.talepId) {
    return NextResponse.json(
      { error: "Aday adı ve talep zorunludur." },
      { status: 400 }
    );
  }

  const talep = await prisma.talep.findUnique({
    where: { id: body.talepId },
  });
  if (!talep) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }

  let iseBaslama: Date | null = null;
  if (body.iseBaslamaTarihi) {
    const d = new Date(body.iseBaslamaTarihi);
    if (!Number.isNaN(d.getTime())) iseBaslama = d;
  }

  const aday = await prisma.aday.create({
    data: {
      talepId: talep.id,
      adayAdi,
      domain: body.domain?.trim() || null,
      talepDetaylari: body.talepDetaylari?.trim() || null,
      source: body.source?.trim() || null,
      surecDurumAdi: body.surecDurumAdi?.trim() || null,
      adayCost: body.adayCost?.trim() || null,
      iseBaslamaTarihi: iseBaslama,
    },
  });

  // Yeni aday eklendikten sonra talebin statüsünü otomatik güncelle
  const adaylari = await prisma.aday.findMany({
    where: { talepId: talep.id },
    select: { surecDurumAdi: true },
  });
  const yeniDurum = talepDurumuBelirle(adaylari.map((a) => a.surecDurumAdi));
  await prisma.talep.update({
    where: { id: talep.id },
    data: { durumAdi: yeniDurum },
  });

  return NextResponse.json({ ok: true, aday }, { status: 201 });
}
