import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { talepDurumunuGuncelle } from "@/lib/otomatik-talep";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id } = await ctx.params;

  let body: {
    adayAdi?: string;
    surecDurumId?: string | null;
    source?: string | null;
    adayCost?: string | null;
    iseBaslamaTarihi?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const existing = await prisma.aday.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Aday bulunamadı." }, { status: 404 });
  }

  let iseBaslama: Date | null | undefined;
  if (body.iseBaslamaTarihi !== undefined) {
    iseBaslama = null;
    if (body.iseBaslamaTarihi) {
      const d = new Date(body.iseBaslamaTarihi);
      if (!Number.isNaN(d.getTime())) iseBaslama = d;
    }
  }

  const aday = await prisma.aday.update({
    where: { id },
    data: {
      ...(body.adayAdi !== undefined && { adayAdi: body.adayAdi }),
      ...(body.surecDurumId !== undefined && {
        surecDurumId: body.surecDurumId || null,
      }),
      ...(body.source !== undefined && { source: body.source }),
      ...(body.adayCost !== undefined && { adayCost: body.adayCost }),
      ...(iseBaslama !== undefined && { iseBaslamaTarihi: iseBaslama }),
    },
  });

  // Aday statüsü değiştiyse talebin statüsünü otomatik güncelle
  if (body.surecDurumId !== undefined && aday.talepId) {
    await talepDurumunuGuncelle(aday.talepId);
  }

  return NextResponse.json({ ok: true, aday });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id } = await ctx.params;

  const existing = await prisma.aday.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Aday bulunamadı." }, { status: 404 });
  }

  const talepId = existing.talepId;
  await prisma.aday.delete({ where: { id } });

  // Aday silindikten sonra talebin statüsünü otomatik güncelle
  if (talepId) {
    await talepDurumunuGuncelle(talepId);
  }

  return NextResponse.json({ ok: true });
}
