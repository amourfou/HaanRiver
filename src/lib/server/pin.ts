import "server-only";
import crypto from "crypto";
import { promisify } from "util";
import { APP } from "@/lib/server/config";
import { ApiError, dbFailure, requireDb } from "@/lib/server/db";

const scrypt = promisify(crypto.scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: crypto.ScryptOptions
) => Promise<Buffer>;
const PARAMS = { N: 16384, r: 8, p: 1 };

export const MAX_FAILURES = 5;
export const LOCK_MS = 10 * 60 * 1000;
const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_MAX_ATTEMPTS = 20;
export const WRONG = "이름이나 PIN이 달라요.";

/** Same format as genshin lib/server/password.ts: scrypt$N$salt$hash */
export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(pin, salt, 32, PARAMS);
  return `scrypt$${PARAMS.N}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function checkPin(pin: string, stored: string): Promise<boolean> {
  const [kind, n, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scrypt(pin, Buffer.from(salt, "base64url"), expected.length, { ...PARAMS, N: Number(n) });
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function validPinFormat(pin: unknown): pin is string {
  return typeof pin === "string" && pin.length >= 4 && pin.length <= 64;
}

async function recordAttempt(key: string, ok: boolean): Promise<void> {
  const db = requireDb();
  const { error } = await db.from("auth_attempts").insert({ key, app: APP, ok });
  if (error) console.error("auth_attempts insert", error.code, error.message);
}

async function assertIpAllowed(ip: string): Promise<void> {
  const db = requireDb();
  const since = new Date(Date.now() - IP_WINDOW_MS).toISOString();
  const { count, error } = await db
    .from("auth_attempts")
    .select("id", { count: "exact", head: true })
    .eq("key", `ip:${ip}`)
    .eq("ok", false)
    .gte("created_at", since);
  if (error) throw dbFailure(error, "auth_attempts count");
  if ((count ?? 0) >= IP_MAX_ATTEMPTS) {
    throw new ApiError(429, "시도가 너무 많아요. 10분 뒤에 다시 해 주세요.", "rate_limited");
  }
}

export interface LoginResult {
  user: { id: string; name: string };
  pinHash: string;
}

/** Name + PIN check with IP rate limit and per-account lockout (5 fails → 10 min). */
export async function verifyLogin(nameRaw: unknown, pin: unknown, ip: string): Promise<LoginResult> {
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  if (!name || name.length > 32) throw new ApiError(400, "이름을 입력해 주세요.");
  if (!validPinFormat(pin)) throw new ApiError(400, "PIN을 입력해 주세요.");
  await assertIpAllowed(ip);
  const db = requireDb();

  const found = await db.from("users").select("id, name").eq("name", name).maybeSingle();
  if (found.error) throw dbFailure(found.error, "login user");
  if (!found.data?.id) {
    await recordAttempt(`ip:${ip}`, false);
    throw new ApiError(401, WRONG, "wrong");
  }
  const user = { id: String(found.data.id), name: String(found.data.name) };

  const row = await db
    .from("user_pins")
    .select("pin_hash, failed_count, locked_until")
    .eq("user_id", user.id)
    .maybeSingle();
  if (row.error) throw dbFailure(row.error, "login pin");
  if (!row.data?.pin_hash) {
    await recordAttempt(`ip:${ip}`, false);
    // No first-come self-set: PINs are issued by an admin/parent.
    throw new ApiError(403, "아직 PIN이 없어요. 엄마·아빠(관리자)에게 PIN을 받아요.", "no_pin");
  }
  if (row.data.locked_until && Date.parse(row.data.locked_until) > Date.now()) {
    throw new ApiError(423, "PIN을 여러 번 틀려서 잠깐 잠겼어요.", "locked");
  }
  if (!(await checkPin(pin, row.data.pin_hash))) {
    const failures = (row.data.failed_count ?? 0) + 1;
    const locked = failures >= MAX_FAILURES;
    await db
      .from("user_pins")
      .update({
        failed_count: locked ? 0 : failures,
        locked_until: locked ? new Date(Date.now() + LOCK_MS).toISOString() : null,
      })
      .eq("user_id", user.id);
    await recordAttempt(`ip:${ip}`, false);
    await recordAttempt(`user:${user.id}`, false);
    if (locked) throw new ApiError(423, "PIN을 여러 번 틀려서 잠깐 잠겼어요.", "locked");
    throw new ApiError(401, WRONG, "wrong");
  }
  if (row.data.failed_count || row.data.locked_until) {
    await db.from("user_pins").update({ failed_count: 0, locked_until: null }).eq("user_id", user.id);
  }
  await recordAttempt(`user:${user.id}`, true);
  return { user, pinHash: row.data.pin_hash };
}

/** Upsert a PIN (admin/script only). Resets lockout and ends existing sessions. */
export async function setPin(userId: string, pin: string): Promise<void> {
  if (!validPinFormat(pin)) throw new ApiError(400, "PIN은 4~64자예요.");
  const db = requireDb();
  const pin_hash = await hashPin(pin);
  const { error } = await db.from("user_pins").upsert(
    { user_id: userId, pin_hash, failed_count: 0, locked_until: null, must_change: false, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) throw dbFailure(error, "set pin");
}
