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

  let body: { talepId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const aday = await prisma.aday.findUnique({ where: { id } });
  if (!aday) {
    return NextResponse.json({ error: "Aday bulunamadı." }, { status: 404 });
  }

  if (body.talepId) {
    const talep = await prisma.talep.findUnique({
      where: { id: body.talepId },
    });
    if (!talep) {
      return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
    }
  }

  const guncel = await prisma.aday.update({
    where: { id },
    data: {
      talepId: body.talepId || null,
      // Bağlandıktan sonra bağlantısız firma bağlamını temizle
      firmaAd: body.talepId ? null : aday.firmaAd,
    },
  });

  return NextResponse.json({ ok: true, aday: guncel });
}
