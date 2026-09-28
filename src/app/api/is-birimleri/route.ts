import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  let body: { ad: string; firmaId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const ad = body.ad?.trim();
  const firmaId = body.firmaId?.trim();

  if (!ad || !firmaId) {
    return NextResponse.json(
      { error: "İş birimi adı ve firma seçimi zorunludur." },
      { status: 400 }
    );
  }

  try {
    const firma = await prisma.firma.findUnique({
      where: { id: firmaId },
    });
    if (!firma) {
      return NextResponse.json(
        { error: "Seçilen firma bulunamadı." },
        { status: 404 }
      );
    }

    const kayit = await prisma.isBirimi.create({
      data: {
        ad,
        firmaId,
      },
    });

    return NextResponse.json({ ok: true, kayit }, { status: 201 });
  } catch (err) {
    const prismaError = err as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { error: "Bu isimde bir iş birimi zaten bu firmada var." },
        { status: 409 }
      );
    }
    console.error("İş birimi oluşturma hatası:", err);
    return NextResponse.json(
      { error: "İş birimi oluşturulamadı." },
      { status: 500 }
    );
  }
}
