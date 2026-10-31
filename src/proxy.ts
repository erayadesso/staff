import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { verifySession, sessionCookieName } from "@/lib/auth";

const PROTECTED_PREFIXES = ["/dashboard"];
const refreshPath = "/api/auth/refresh";

/**
 * Oturum yönetimi (auth proxy).
 *
 * 1. JWT doğrula (expired veya invalid mi?)
 * 2. JWT geçersiz → /api/auth/refresh ile yenile (remember_token ile)
 * 3. Refresh başarılı → yeni JWT cookie set et, devam et
 * 4. Refresh başarısız → login'e yönlendir
 *
 * Bu sayede kullanıcı "Beni Hatırla" ile login olmuşsa,
 * JWT expire olsa bile otomatik yenilenir — login sayfasına düşmez.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieStore = request.cookies;
  const sessionCookie = cookieStore.get(sessionCookieName);

  // Refresh endpoint'ten kaçın (Sonsuz döngü)
  if (pathname === refreshPath) {
    return NextResponse.next();
  }

  // Korumalı rota kontrolü
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isRoot = pathname === "/";

  // Ne korumalı bir sayfa ne de giriş sayfası ise JWT doğrulamayı atla.
  if (!needsAuth && !isRoot) {
    return NextResponse.next();
  }

  // ——— Oturum doğrulama / yenileme ———
  let isAuthenticated = false;

  if (sessionCookie?.value) {
    try {
      // JWT geçerli mi?
      await jwtVerify(sessionCookie.value, new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me"));
      isAuthenticated = true;
    } catch {
      // JWT expired veya invalid — refresh dene
      isAuthenticated = false;
    }
  }

  // JWT geçersiz/expired — /api/auth/refresh ile yenile
  if (needsAuth && !isAuthenticated && sessionCookie) {
    const refreshResponse = await fetch(
      new URL(refreshPath, request.url),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Cookie'yi manuel olarak kopyala (remember_token dahil)
          cookie: Object.entries(cookieStore)
            .map(([name, value]) => `${name}=${value?.value}`)
            .join("; "),
        },
        redirect: "manual",
      }
    );

    if (refreshResponse.status === 200) {
      const newSession = refreshResponse.headers.getSetCookie?.().find((c) =>
        c.startsWith(sessionCookieName)
      );

      if (newSession) {
        const response = NextResponse.next();
        response.headers.append("Set-Cookie", newSession);
        isAuthenticated = true;
      }
    }
  }

  // JWT yoksa veya refresh de başarısız — authentication kontrolü
  const authenticated = isAuthenticated || Boolean(sessionCookie && await verifySession(sessionCookie.value));

  // Korumalı sayfaya girişsiz erişim → login'e yönlendir
  if (needsAuth && !authenticated) {
    const url = new URL("/", request.url);
    url.searchParams.set("from", pathname);
    url.searchParams.set("notice", "Oturum süresi doldu. Tekrar giriş yapın.");
    return NextResponse.redirect(url);
  }

  // Zaten giriş yapan kullanıcı login sayfasına gidemez → dashboard
  if (isRoot && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
