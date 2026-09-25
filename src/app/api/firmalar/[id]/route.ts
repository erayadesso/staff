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

  let body: { ad?: string; logoUrl?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const ad = body.ad?.trim();
  if (!ad && !("logoUrl" in body)) {
    return NextResponse.json({ error: "Güncellenmek istenen alan zorunlu." }, { status: 400 });
  }

  if (body.logoUrl != null) {
    const logoUrl = body.logoUrl.trim();
    if (!logoUrl) {
      body.logoUrl = null;
    } else if (!/^https?:\/\/\S+$/i.test(logoUrl)) {
      return NextResponse.json(
        { error: "Geçerli bir http:// veya https:// URL girin." },
        { status: 400 }
      );
    }
  }

  try {
    const firma = await prisma.firma.findUnique({
      where: { id },
      include: { isBirimleri: true },
    });
    if (!firma) {
      return NextResponse.json({ error: "Firma bulunamadı." }, { status: 404 });
    }

    const yeniFirma = await prisma.$transaction(async (tx) => {
      const data: { ad?: string; logoUrl?: string | null } = {};
      if (ad) data.ad = ad;
      if ("logoUrl" in body) data.logoUrl = body.logoUrl;

      const guncellenen = await tx.firma.update({
        where: { id },
        data,
      });

      const eskiAd = firma.ad;
      if (ad && eskiAd !== ad) {
        const ayniAdliBirimler = await tx.isBirimi.findMany({
          where: { firmaId: id, ad: eskiAd },
        });
        for (const b of ayniAdliBirimler) {
          await tx.isBirimi.update({
            where: { id: b.id },
            data: { ad },
          });
        }
      }

      return guncellenen;
    });

    return NextResponse.json({ ok: true, firma: yeniFirma });
  } catch (err) {
    console.error("Firma güncelleme hatası:", err);
    return NextResponse.json(
      { error: "Firma güncellenemedi. Kaydedilen veriyle çakışma olabilir." },
      { status: 409 }
    );
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }
  const { id } = await ctx.params;

  try {
    const firma = await prisma.firma.findUnique({ where: { id } });
    if (!firma) {
      return NextResponse.json({ error: "Firma bulunamadı." }, { status: 404 });
    }

    const talepSayisi = await prisma.talep.count({
      where: { isBirimi: { firmaId: id } },
    });
    if (talepSayisi > 0) {
      return NextResponse.json(
        { error: "Firmaya bağlı talep bulunmaktadır, silme işlemi gerçekleştirilemez." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.isBirimi.deleteMany({ where: { firmaId: id } });
      await tx.firma.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Firma silme hatası:", err);
    return NextResponse.json({ error: "Firma silinemedi." }, { status: 500 });
  }
}
