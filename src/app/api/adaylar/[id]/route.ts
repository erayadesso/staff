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
    candidateName?: string;
    processStatusId?: string | null;
    source?: string | null;
    cost?: string | null;
    startDate?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const existing = await prisma.candidate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Aday bulunamadı." }, { status: 404 });
  }

  let startDate: Date | null | undefined;
  if (body.startDate !== undefined) {
    startDate = null;
    if (body.startDate) {
      const d = new Date(body.startDate);
      if (!Number.isNaN(d.getTime())) startDate = d;
    }
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data: {
      ...(body.candidateName !== undefined && { candidateName: body.candidateName }),
      ...(body.processStatusId !== undefined && {
        processStatusId: body.processStatusId || null,
      }),
      ...(body.source !== undefined && { source: body.source }),
      ...(body.cost !== undefined && { cost: body.cost }),
      ...(startDate !== undefined && { startDate }),
    },
  });

  // Aday statüsü değiştiyse talebin statüsünü otomatik güncelle
  if (body.processStatusId !== undefined && candidate.requestId) {
    await talepDurumunuGuncelle(candidate.requestId);
  }


  return NextResponse.json({ ok: true, candidate });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id } = await ctx.params;

  const existing = await prisma.candidate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Aday bulunamadı." }, { status: 404 });
  }

  const request_id = existing.requestId;
  await prisma.candidate.delete({ where: { id } });

  // Aday silindikten sonra talebin statüsünü otomatik güncelle
  if (request_id) {
    await talepDurumunuGuncelle(request_id);
  }


  return NextResponse.json({ ok: true });
}
