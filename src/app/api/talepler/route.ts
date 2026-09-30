import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  let body: {
    talepSahibi?: string;
    adayTuru?: string;
    adet?: string;
    notlar?: string;
    guncelNot?: string;
    durumId?: string;
    deadline?: string | null;
    adessoSuresi?: string | null;
    isBirimiId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const talepSahibi = body.talepSahibi?.trim();
  const adayTuru = body.adayTuru?.trim();
  if (!talepSahibi || !adayTuru || !body.isBirimiId) {
    return NextResponse.json(
      { error: "Talep sahibi, aday türü ve iş birimi zorunludur." },
      { status: 400 }
    );
  }

  const isBirimi = await prisma.isBirimi.findUnique({
    where: { id: body.isBirimiId },
  });
  if (!isBirimi) {
    return NextResponse.json({ error: "Geçersiz iş birimi." }, { status: 400 });
  }

  const adetMetin = body.adet?.trim();
  if (adetMetin) {
    const adetSayi = Number(adetMetin);
    if (!/^\d+$/.test(adetMetin) || adetSayi < 1 || adetSayi > 100) {
      return NextResponse.json(
        { error: "Adet 1 ile 100 arasında bir tam sayı olmalıdır." },
        { status: 400 }
      );
    }
  }

  let deadline: Date | null = null;
  if (body.deadline) {
    const d = new Date(body.deadline);
    if (!Number.isNaN(d.getTime())) deadline = d;
  }

  let adessoSuresi: Date | null = null;
  if (body.adessoSuresi) {
    const d = new Date(body.adessoSuresi);
    if (!Number.isNaN(d.getTime())) adessoSuresi = d;
  }

  // Varsayılan talep durumu: en düşük sira'lı "yeni" ton (ya da ilk kayıt)
  let durumId: string | null = null;
  if (body.durumId) {
    const d = await prisma.talepDurumu.findUnique({ where: { id: body.durumId } });
    if (d) durumId = d.id;
  }
  if (!durumId) {
    const varsayilan = await prisma.talepDurumu.findFirst({
      where: { ton: "yeni" },
      orderBy: { sira: "asc" },
    });
    durumId = varsayilan?.id ?? null;
  }

  try {
    const talep = await prisma.talep.create({
      data: {
        talepSahibi,
        adayTuru,
        adet: body.adet?.trim() || null,
        notlar: body.notlar?.trim() || null,
        guncelNot: body.guncelNot?.trim() || null,
        durumId,
        deadline,
        adessoSuresi,
        isBirimiId: isBirimi.id,
        olusturanId: user.id,
      },
    });

    return NextResponse.json({ ok: true, talep }, { status: 201 });
  } catch (err: any) {
    console.error("Talep oluşturulurken hata:", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Bu talep zaten mevcut." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Talep oluşturulamadı." },
      { status: 500 }
    );
  }
}
