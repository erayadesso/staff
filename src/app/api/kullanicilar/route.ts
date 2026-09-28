import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  const tumKullanicilar = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tumKullanicilar });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  let body: { email: string; name?: string; sifre: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!body.email || !body.sifre) {
    return NextResponse.json(
      { error: "E-posta ve şifre zorunludur." },
      { status: 400 }
    );
  }

  const bcrypt = await import("bcryptjs");
  const sifreHash = await bcrypt.hash(body.sifre, 12);

  try {
    const yeniKullanici = await prisma.user.create({
      data: {
        email: body.email.toLowerCase().trim(),
        name: body.name?.trim() || null,
        passwordHash: sifreHash,
        role: body.role || "VIEWER",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        kullanici: {
          id: yeniKullanici.id,
          email: yeniKullanici.email,
          name: yeniKullanici.name,
          role: yeniKullanici.role,
          isActive: yeniKullanici.isActive,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kullanımda." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Kullanıcı oluşturulamadı." },
      { status: 500 }
    );
  }
}
