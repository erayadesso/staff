import { cache } from "react";
import { cookies } from "next/headers";
import { verifySession, sessionCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/types";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

/**
 * Geçerli oturumun kullanıcı bilgisini döndürür.
 * Oturum yoksa veya kullanıcı pasifse null döner.
 *
 * Önce normal JWT cookie'yi kontrol eder, yoksa remember token'ı doğrular.
 *
 * React cache() ile sarmalanmıştır: aynı istek (render) sırasında birden
 * fazla kez çağrıldığında tekrarlanan JWT doğrulama ve DB sorgusunu önler.
 * Layout + sayfa aynı request'te çağırdığından DB'ye tek vuruş yapılır.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  // 1) Normal JWT session kontrol
  if (token) {
    const session = await verifySession(token);
    if (session) {
      const user = await prisma.user.findUnique({ where: { email: session.email } });
      if (!user || !user.isActive) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }
  }

  // 2) JWT yoksa veya geçersizse — remember token kontrol
  const rememberToken = cookieStore.get("remember_token")?.value;
  if (rememberToken) {
    const user = await prisma.user.findFirst({
      where: { rememberToken: { not: null } },
    });

    if (user && user.rememberToken && user.tokenExpiry && user.isActive) {
      // Token expiry kontrol
      if (new Date(user.tokenExpiry) < new Date()) {
        await prisma.user.update({
          where: { id: user.id },
          data: { rememberToken: null, tokenExpiry: null },
        });
        return null;
      }

      // Token doğrula (hash karşılaştırması)
      const valid = await bcrypt.compare(rememberToken, user.rememberToken);
      if (valid) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }
  }

  return null;
});

/** Kullanıcının ADMIN olup olmadığını döndürür */
export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "ADMIN";
}
