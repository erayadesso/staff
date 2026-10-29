import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET — Aktif release note (en yeni) */
export async function GET() {
  try {
    const releaseNote = await prisma.releaseNote.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, releaseNote });
  } catch {
    return NextResponse.json({ error: "Release note alınamadı." }, { status: 500 });
  }
}

/** POST — Sadece ADMIN yeni release note ekleyebilir */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { version, title, notes } = body;

    if (!version || !title || !notes) {
      return NextResponse.json(
        { error: "version, title ve notes alanları zorunludur." },
        { status: 400 }
      );
    }

    // Önceki aktif release note'ları pasifleştir
    await prisma.releaseNote.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const releaseNote = await prisma.releaseNote.create({
      data: {
        version,
        title,
        body: notes,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, releaseNote }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Release note oluşturulamadı." }, { status: 500 });
  }
}
