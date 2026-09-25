import type { SessionPayload } from "@/lib/types";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me"
);
const SESSION_COOKIE = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 saat

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

export const sessionCookieName = SESSION_COOKIE;
export const sessionCookieMaxAge = SESSION_DURATION_SECONDS;
