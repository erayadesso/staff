import type { SessionPayload } from "@/lib/types";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "node:crypto";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me"
);
const SESSION_COOKIE = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 saat
const REMEMBER_COOKIE = "remember_token";
const REMEMBER_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 gün

export type { SessionPayload };

/** Oturum JWT'sini imzala */
export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .setIssuedAt()
    .sign(secret);
}

/** JWT'yi doğrula ve payload döndür */
export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.email !== "string") return null;
    return { email: payload.email, role: String(payload.role ?? "VIEWER") };
  } catch {
    return null;
  }
}

/** Güvenli, kriptografik olarak tahmin edilemez token üret (64 hex karakter) */
export function generateRememberToken(): string {
  return randomBytes(32).toString("hex");
}

export const sessionCookieName = SESSION_COOKIE;
export const sessionCookieMaxAge = SESSION_DURATION_SECONDS;
export const rememberCookieName = REMEMBER_COOKIE;
export const rememberCookieMaxAge = REMEMBER_DURATION_SECONDS;
