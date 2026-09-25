import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }
  const { id } = await ctx.params;

  let body: { ad?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const ad = body.ad?.trim();
  if (!ad) {
    return NextResponse.json({ error: "İş birimi adı zorunlu." }, { status: 400 });
  }

  try {
    const kayit = await prisma.isBirimi.update({
      where: { id },
      data: { ad },
    });
    return NextResponse.json({ ok: true, kayit });
  } catch (err) {
    const prismaError = err as { code?: string };
    if (prismaError.code === "P2025") {
      return NextResponse.json(
        { error: "İş birimi bulunamadı." },
        { status: 404 }
      );
    }
    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { error: "Bu isimde bir iş birimi zaten var." },
        { status: 409 }
      );
    }
    console.error("İş birimi güncelleme hatası:", err);
    return NextResponse.json(
      { error: "İş birimi güncellenemedi." },
      { status: 500 }
    );
  }
}
