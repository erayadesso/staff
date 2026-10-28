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

  let body: { name?: string; parentId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const ad = body.name?.trim();
  if (!ad && body.parentId == null) {
    return NextResponse.json({ error: "Güncellenecek alan zorunlu." }, { status: 400 });
  }

  // Kendisine parent olamaz
  if (body.parentId === id) {
    return NextResponse.json({ error: "Alan adı kendisinin üst-alanı olamaz." }, { status: 400 });
  }

  // Kendisine parent olamaz (basit kontrol, döngü edge case'i nadir)
  if (body.parentId === id) {
    return NextResponse.json({ error: "Alan adı kendisinin üst-alanı olamaz." }, { status: 400 });
  }

  // Duplikasyon kontrolü (yeni isim varsa)
  if (ad) {
    const duplicate = await prisma.domain.findFirst({
      where: {
        name: ad,
        id: { not: id },
        parentId: body.parentId ?? null,
      },
    });
    if (duplicate) {
      return NextResponse.json({ error: `"${ad}" zaten var.` }, { status: 409 });
    }
  }

  try {
    const data: { name?: string; parentId?: string | null } = {};
    if (ad) data.name = ad;
    if ("parentId" in body) data.parentId = body.parentId || null;

    const domain = await prisma.domain.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true, requests: true } },
      },
    });
    return NextResponse.json(domain);
  } catch {
    return NextResponse.json({ error: "Güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }
  const { id } = await ctx.params;

  try {
    const domain = await prisma.domain.findUnique({
      where: { id },
      include: { children: true },
    });
    if (!domain) {
      return NextResponse.json({ error: "Alan adı bulunamadı." }, { status: 404 });
    }

    // Çocukları varsa — parent'ı null yap (cascade değil, alt alanlar kalsın)
    if (domain.children.length > 0) {
      await prisma.domain.updateMany({
        where: { parentId: id },
        data: { parentId: null },
      });
    }

    // Bu alana bağlı talep var mı?
    const talepSayisi = await prisma.request.count({
      where: { domainId: id },
    });
    if (talepSayisi > 0) {
      return NextResponse.json(
        { error: "Bu alan adına bağlı talep bulunmaktadır. Önce talepleri güncelleyin." },
        { status: 400 }
      );
    }

    await prisma.domain.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Silinemedi." }, { status: 500 });
  }
}
