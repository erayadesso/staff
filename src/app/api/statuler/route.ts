import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

type Tip = "talep" | "surec";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    tip?: Tip;
    ad?: string;
    sira?: number;
  } | null;
  if (!body || !body.ad?.trim() || (body.tip !== "talep" && body.tip !== "surec")) {
    return NextResponse.json({ error: "Tip ve ad zorunludur." }, { status: 400 });
  }

  const ad = body.ad.trim();

  try {
    if (body.tip === "talep") {
      const sira = body.sira ?? (await prisma.talepDurumu.count());
      const kayit = await prisma.talepDurumu.create({ data: { ad, sira } });
      return NextResponse.json({ ok: true, kayit }, { status: 201 });
    }
    const sira = body.sira ?? (await prisma.surecDurumu.count());
    const kayit = await prisma.surecDurumu.create({ data: { ad, sira } });
    return NextResponse.json({ ok: true, kayit }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu statü zaten mevcut." }, { status: 409 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    tip?: Tip;
    id?: string;
    ad?: string;
  } | null;
  if (
    !body ||
    !body.id ||
    !body.ad?.trim() ||
    (body.tip !== "talep" && body.tip !== "surec")
  ) {
    return NextResponse.json({ error: "Tip, id ve ad zorunludur." }, { status: 400 });
  }

  try {
    if (body.tip === "talep") {
      const kayit = await prisma.talepDurumu.update({
        where: { id: body.id },
        data: { ad: body.ad.trim() },
      });
      return NextResponse.json({ ok: true, kayit });
    }
    const kayit = await prisma.surecDurumu.update({
      where: { id: body.id },
      data: { ad: body.ad.trim() },
    });
    return NextResponse.json({ ok: true, kayit });
  } catch {
    return NextResponse.json({ error: "Statü bulunamadı veya ad çakışıyor." }, { status: 409 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    tip?: Tip;
    id?: string;
  } | null;
  if (!body || !body.id || (body.tip !== "talep" && body.tip !== "surec")) {
    return NextResponse.json({ error: "Tip ve id zorunludur." }, { status: 400 });
  }

  try {
    if (body.tip === "talep") {
      await prisma.talepDurumu.delete({ where: { id: body.id } });
    } else {
      await prisma.surecDurumu.delete({ where: { id: body.id } });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Statü bulunamadı." }, { status: 404 });
  }
}
