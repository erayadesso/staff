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

  let body: { requestId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) {
    return NextResponse.json({ error: "Aday bulunamadı." }, { status: 404 });
  }

  if (body.requestId) {
    const request = await prisma.request.findUnique({
      where: { id: body.requestId },
    });
    if (!request) {
      return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
    }
  }

  const guncel = await prisma.candidate.update({
    where: { id },
    data: {
      requestId: body.requestId || null,
      // Bağlandıktan sonra bağlantısız firma bağlamını temizle
      clientName: body.requestId ? null : candidate.clientName,
    },
  });

  return NextResponse.json({ ok: true, candidate: guncel });
}
