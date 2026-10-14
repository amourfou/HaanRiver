import { NextResponse } from "next/server";
import { dbFailure, requireDb } from "@/lib/server/db";
import { validateScore, verifyGameToken } from "@/lib/server/gameToken";
import { assertSameOrigin, fail, readJson } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Save one finished game. The server checks the score against play time/round and updates high_score itself. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const body = await readJson<{ token?: unknown; score?: unknown; round?: unknown; virusesReachedBottom?: unknown }>(request);
    const startedAt = verifyGameToken(body.token, user.id);
    const score = Number(body.score);
    const round = Number(body.round);
    const bottom = Math.min(Math.max(Math.floor(Number(body.virusesReachedBottom) || 0), 0), 1000);
    validateScore(score, round, Date.now() - startedAt);
    const db = requireDb();

    const ins = await db
      .from("game_sessions")
      .insert({ user_id: user.id, score, round, viruses_reached_bottom: bottom, played_at: new Date().toISOString() });
    if (ins.error) throw dbFailure(ins.error, "game insert");

    const cur = await db.from("users").select("high_score").eq("id", user.id).maybeSingle();
    if (cur.error) throw dbFailure(cur.error, "high score read");
    let highScore = Number(cur.data?.high_score ?? 0);
    if (score > highScore) {
      const up = await db
        .from("users")
        .update({ high_score: score, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .lt("high_score", score);
      if (up.error) throw dbFailure(up.error, "high score update");
      highScore = score;
    }
    return NextResponse.json({ ok: true, highScore });
  } catch (error) {
    return fail(error);
  }
}
