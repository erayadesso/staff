import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  let body: { firmaAd?: string; birimAd?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const firmaAd = body.firmaAd?.trim();
  if (!firmaAd) {
    return NextResponse.json({ error: "Firma adı zorunlu." }, { status: 400 });
  }

  try {
    const company = await prisma.company.upsert({
      where: { name: firmaAd },
      update: {},
      create: { name: firmaAd },
    });

    if (body.birimAd?.trim()) {
      await prisma.department.upsert({
        where: { companyId_name: { companyId: company.id, name: body.birimAd.trim() } },
        update: {},
        create: { companyId: company.id, name: body.birimAd.trim() },
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "İşlem başarısız." }, { status: 409 });
  }
}
