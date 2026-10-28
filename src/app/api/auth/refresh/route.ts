import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  sessionCookieName,
  sessionCookieMaxAge,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const cookieStore = await (await import("next/headers")).cookies();
  const rememberToken = cookieStore.get("remember_token")?.value;

  if (!rememberToken) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  // Token hash'i DB'de bulunanla karşılaştır
  const user = await prisma.user.findFirst({
    where: { rememberToken: { not: null } },
  });

  if (!user || !user.rememberToken || !user.tokenExpiry || !user.isActive) {
    return NextResponse.json({ error: "Geçersiz oturum." }, { status: 401 });
  }

  // Expiry kontrol
  if (new Date(user.tokenExpiry) < new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { rememberToken: null, tokenExpiry: null },
    });
    return NextResponse.json({ error: "Oturum süresi dolmuş." }, { status: 401 });
  }

  // Token doğrula
  const valid = await bcrypt.compare(rememberToken, user.rememberToken);
  if (!valid) {
    return NextResponse.json({ error: "Geçersiz oturum." }, { status: 401 });
  }

  // Yeni JWT oluştur
  const token = await createSession({ email: user.email, role: user.role });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionCookieMaxAge,
  });

  return response;
}
