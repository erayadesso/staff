import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { talepDurumunuGuncelle } from "@/lib/otomatik-talep";

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
    surecDurumId?: string;
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
      surecDurumId: body.surecDurumId || null,
      adayCost: body.adayCost?.trim() || null,
      iseBaslamaTarihi: iseBaslama,
    },
  });

  // Yeni aday eklendikten sonra talebin statüsünü otomatik güncelle
  await talepDurumunuGuncelle(talep.id);

  return NextResponse.json({ ok: true, aday }, { status: 201 });
}
