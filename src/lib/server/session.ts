import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { APP, SESSION_COOKIE } from "@/lib/server/config";
import { ApiError, dbFailure, requireDb } from "@/lib/server/db";

const MAX_AGE_S = 60 * 60 * 24 * 30;

export interface SessionUser {
  id: string;
  name: string;
  organization: string;
  role: string | null;
  isAdmin: boolean;
}

interface Token {
  uid: string;
  iat: number;
  exp: number;
  /** Fingerprint of the PIN hash: changing the PIN ends old sessions. */
  pv: string;
}

function key(): Buffer {
  const raw = process.env.SESSION_SECRET || "";
  if (raw.length < 16) throw new ApiError(503, "서버 설정(SESSION_SECRET)이 없어 로그인할 수 없어요.");
  return crypto.createHash("sha256").update(`${APP}-session:${raw}`).digest();
}

function mac(body: string): string {
  return crypto.createHmac("sha256", key()).update(body).digest("base64url");
}

export function pinFingerprint(hash: string): string {
  return crypto.createHash("sha256").update(hash).digest("base64url").slice(0, 16);
}

function verify(raw: string | undefined): Token | null {
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(mac(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const t = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Token;
    if (!t.uid || !t.pv || !Number.isFinite(t.exp) || t.exp < Date.now() / 1000) return null;
    return t;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, userId: string, pinHash: string): void {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ uid: userId, iat: now, exp: now + MAX_AGE_S, pv: pinFingerprint(pinHash) } satisfies Token)).toString("base64url");
  response.cookies.set(SESSION_COOKIE, `${body}.${mac(body)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

/** Verifies the signed cookie, the current PIN, and reads role fresh from the DB each request. */
export async function currentUser(): Promise<SessionUser | null> {
  const token = verify(cookies().get(SESSION_COOKIE)?.value);
  if (!token) return null;
  const db = requireDb();
  const [pin, user] = await Promise.all([
    db.from("user_pins").select("pin_hash").eq("user_id", token.uid).maybeSingle(),
    db.from("users").select("id, name, organization, role, is_admin").eq("id", token.uid).maybeSingle(),
  ]);
  if (pin.error) throw dbFailure(pin.error, "session pin");
  if (user.error) throw dbFailure(user.error, "session user");
  if (!pin.data?.pin_hash || pinFingerprint(pin.data.pin_hash) !== token.pv || !user.data) return null;
  const role = (user.data.role as string | null) ?? null;
  return {
    id: String(user.data.id),
    name: String(user.data.name),
    organization: String(user.data.organization ?? ""),
    role,
    isAdmin: ADMIN_ROLES.has(role ?? "") || user.data.is_admin === true,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new ApiError(401, "다시 로그인해 주세요.", "unauthenticated");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) throw new ApiError(403, "관리자만 할 수 있어요.");
  return user;
}
