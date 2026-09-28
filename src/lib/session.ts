import { cache } from "react";
import { cookies } from "next/headers";
import { verifySession, sessionCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/types";

/**
 * Geçerli oturumun kullanıcı bilgisini döndürür.
 * Oturum yoksa veya kullanıcı pasifse null döner.
 *
 * React cache() ile sarmalanmıştır: aynı istek (render) sırasında birden
 * fazla kez çağrıldığında tekrarlanan JWT doğrulama ve DB sorgusunu önler.
 * Layout + sayfa aynı request'te çağırdığından DB'ye tek vuruş yapılır.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  const session = await verifySession(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.email },
  });
  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
});

/** Kullanıcının ADMIN olup olmadığını döndürür */
export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "ADMIN";
}
