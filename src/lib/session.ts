import { cookies } from "next/headers";
import { verifySession, sessionCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/types";

/**
 * Geçerli oturumun kullanıcı bilgisini döndürür.
 * Oturum yoksa veya kullanıcı pasifse null döner.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
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
}

/** Kullanıcının ADMIN olup olmadığını döndürür */
export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "ADMIN";
}
