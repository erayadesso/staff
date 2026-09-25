import { NextResponse, type NextRequest } from "next/server";
import { verifySession, sessionCookieName } from "@/lib/auth";

const PROTECTED_PREFIXES = ["/dashboard"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(sessionCookieName)?.value;
  const session = token ? await verifySession(token) : null;
  const isAuthenticated = Boolean(session);

  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Korumalı sayfaya girişsiz erişim → login'e yönlendir
  if (needsAuth && !isAuthenticated) {
    const url = new URL("/", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Zaten giriş yapan kullanıcı login sayfasına gidemez → dashboard
  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
