import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionCookieName, rememberCookieName } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export async function POST() {
  const user = await getSessionUser();

  const response = NextResponse.json({ ok: true });

  // Normal session cookie'yi sil
  response.cookies.set(sessionCookieName, "", { path: "/", maxAge: 0 });
  response.cookies.set(rememberCookieName, "", { path: "/", maxAge: 0 });

  // DB'den remember token'ı temizle (güvenlik)
  if (user) {
    await prisma.user.update({
      where: { email: user.email },
      data: {
        rememberToken: null,
        tokenExpiry: null,
      },
    });
  }

  return response;
}
