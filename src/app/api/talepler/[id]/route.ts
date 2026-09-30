import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id } = await ctx.params;

  let body: { durumId?: string; guncelNot?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const existing = await prisma.talep.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }

  const talep = await prisma.talep.update({
    where: { id },
    data: {
      ...(body.durumId !== undefined && { durumId: body.durumId || null }),
      ...(body.guncelNot !== undefined && { guncelNot: body.guncelNot }),
    },
  });

  return NextResponse.json({ ok: true, talep });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }
  const { id } = await ctx.params;

  const talep = await prisma.talep.findUnique({
    where: { id },
    include: { adaylar: true },
  });

  if (!talep) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }

  if (talep.adaylar.length > 0) {
    return NextResponse.json(
      { error: `Bu talebe bağlı ${talep.adaylar.length} adet aday kaydı bulunmaktadır. Talep silmek için önce adayları silmelisiniz.` },
      { status: 400 }
    );
  }

  await prisma.talep.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
