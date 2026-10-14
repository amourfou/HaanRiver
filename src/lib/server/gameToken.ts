import "server-only";
import crypto from "crypto";
import { ApiError } from "@/lib/server/db";

/** Signed "game started at" token so the server can bound score by real play time. */
const MAX_AGE_MS = 3 * 60 * 60 * 1000;

function key(): Buffer {
  const raw = process.env.SESSION_SECRET || "";
  if (raw.length < 16) throw new ApiError(503, "서버 설정(SESSION_SECRET)이 없어요.");
  return crypto.createHash("sha256").update(`haanriver-game:${raw}`).digest();
}

export function issueGameToken(userId: string): string {
  const body = Buffer.from(JSON.stringify({ u: userId, t: Date.now(), n: crypto.randomBytes(8).toString("base64url") })).toString("base64url");
  return `${body}.${crypto.createHmac("sha256", key()).update(body).digest("base64url")}`;
}

/** Returns the start time (ms) if valid for this user. */
export function verifyGameToken(token: unknown, userId: string): number {
  if (typeof token !== "string") throw new ApiError(400, "게임 시작 정보가 없어요.");
  const [body, sig] = token.split(".");
  const expected = Buffer.from(crypto.createHmac("sha256", key()).update(body || "").digest("base64url"));
  const given = Buffer.from(sig || "");
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) throw new ApiError(400, "게임 시작 정보가 잘못되었어요.");
  const t = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { u: string; t: number };
  if (t.u !== userId) throw new ApiError(400, "게임 시작 정보가 잘못되었어요.");
  if (Date.now() - t.t > MAX_AGE_MS) throw new ApiError(400, "게임이 너무 오래되었어요.");
  return t.t;
}

/** Mirrors src/lib/gameLogic.ts getVirusesPerRound. */
function virusesPerRound(round: number): number {
  return Math.round(50 * Math.pow(1.1, round - 1));
}

export const MAX_ROUND = 100;
/** Very generous per-virus cap (10pt base, multi-select bonus, combo ×, super-virus ×1.2, bomb) so real kids are never rejected. */
const MAX_POINTS_PER_VIRUS = 1000;
/** Viruses fall over time; a human cannot clear more than this many points per second. */
const MAX_POINTS_PER_SECOND = 1000;
const MIN_SECONDS_PER_ROUND = 10;

export function validateScore(score: number, round: number, elapsedMs: number): void {
  if (!Number.isInteger(score) || score < 0 || score > 10_000_000) throw new ApiError(400, "점수가 이상해요.");
  if (!Number.isInteger(round) || round < 1 || round > MAX_ROUND) throw new ApiError(400, "라운드가 이상해요.");
  let maxViruses = 0;
  for (let r = 1; r <= round; r++) maxViruses += virusesPerRound(r);
  const seconds = elapsedMs / 1000;
  if (score > maxViruses * MAX_POINTS_PER_VIRUS) throw new ApiError(422, "점수를 저장할 수 없어요.");
  if (score > Math.max(seconds, 1) * MAX_POINTS_PER_SECOND) throw new ApiError(422, "점수를 저장할 수 없어요.");
  if ((round - 1) * MIN_SECONDS_PER_ROUND > seconds) throw new ApiError(422, "점수를 저장할 수 없어요.");
}
