import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id } = await ctx.params;

  let body: { statusId?: string; currentNote?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const existing = await prisma.request.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }

  const result = await prisma.request.update({
    where: { id },
    data: {
      ...(body.statusId !== undefined && { statusId: body.statusId || null }),
      ...(body.currentNote !== undefined && { currentNote: body.currentNote }),
    },
  });


  return NextResponse.json({ ok: true, request: result });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }
  const { id } = await ctx.params;

  const result = await prisma.request.findUnique({
    where: { id },
    include: { candidates: true },
  });

  if (!result) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }

  if (result.candidates.length > 0) {
    return NextResponse.json(
      { error: `Bu talebe bağlı ${result.candidates.length} adet aday kaydı bulunmaktadır. Talep silmek için önce adayları silmelisiniz.` },
      { status: 400 }
    );
  }

  await prisma.request.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
