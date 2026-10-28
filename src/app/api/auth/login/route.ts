import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  sessionCookieName,
  sessionCookieMaxAge,
  generateRememberToken,
  rememberCookieName,
  rememberCookieMaxAge,
} from "@/lib/auth";
import { isAdessoEmail } from "@/lib/domain";

/** IP bazlı basit rate limiter (in-memory, tek instance için yeterli) */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10; // 10 deneme
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5 dakika

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true; // İzin ver
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false; // Eşiği aştı
  }

  record.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; rememberMe?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  try {
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const rememberMe = body.rememberMe === true;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre zorunludur." },
        { status: 400 }
      );
    }

    if (!isAdessoEmail(email)) {
      return NextResponse.json(
        { error: "Yalnızca adesso e-posta adresiyle giriş yapılabilir." },
        { status: 401 }
      );
    }

    // Rate limiting (IP bazlı)
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkLoginRateLimit(ip)) {
      return NextResponse.json(
        { error: "Çok fazla deneme. Lütfen 5 dakika sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı." },
        { status: 401 }
      );
    }

    // Session JWT oluştur
    const token = await createSession({ email: user.email, role: user.role });

    const response = NextResponse.json({ ok: true });

    // Normal session cookie (12 saat)
    response.cookies.set(sessionCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: sessionCookieMaxAge,
    });

    // Remember token cookie (30 gün)
    if (rememberMe) {
      const plainToken = generateRememberToken();
      const hashedToken = await bcrypt.hash(plainToken, 12);

      // Eski token'ı temizle, yenisini kaydet
      await prisma.user.update({
        where: { email },
        data: {
          rememberToken: hashedToken,
          tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
        },
      });

      response.cookies.set(rememberCookieName, plainToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: rememberCookieMaxAge,
      });
    } else {
      // Remember token checked değilse temizle
      await prisma.user.update({
        where: { email },
        data: {
          rememberToken: null,
          tokenExpiry: null,
        },
      });
    }

    return response;
  } catch (err: any) {
    console.error("Login hatası:", err);
    return NextResponse.json(
      { error: "Bir hata oluştu, lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
