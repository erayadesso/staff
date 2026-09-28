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

  let body: { sifre?: string; name?: string; role?: string; isActive?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const mevcutKullanici = await prisma.user.findUnique({
    where: { id },
  });

  if (!mevcutKullanici) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  let data: any = {};
  if (body.name !== undefined) {
    data.name = body.name?.trim() || null;
  }
  if (body.role !== undefined) {
    data.role = body.role;
  }
  if (body.isActive !== undefined) {
    data.isActive = body.isActive;
  }

  if (body.sifre) {
    const bcrypt = await import("bcryptjs");
    data.passwordHash = await bcrypt.hash(body.sifre, 12);
  }

  const guncellenen = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, kullanici: guncellenen });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  const { id } = await ctx.params;

  if (user.id === id) {
    return NextResponse.json(
      { error: "Kendi hesabınızı silemezsiniz." },
      { status: 400 }
    );
  }

  const mevcutKullanici = await prisma.user.findUnique({
    where: { id },
  });

  if (!mevcutKullanici) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  await prisma.user.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
