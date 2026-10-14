import { NextResponse } from "next/server";
import { ApiError, dbFailure, requireDb } from "@/lib/server/db";
import { fail } from "@/lib/server/respond";
import { currentUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

function weekStartIso(): string {
  // Monday 00:00 KST
  const kst = new Date(Date.now() + 9 * 3600_000);
  const day = kst.getUTCDay();
  kst.setUTCDate(kst.getUTCDate() - (day === 0 ? 6 : day - 1));
  kst.setUTCHours(0, 0, 0, 0);
  return new Date(kst.getTime() - 9 * 3600_000).toISOString();
}

type Row = { score: number; played_at: string; users: { name: string; organization: string } | null };

/** Rankings: only name, organization, score, date (no ids). Public except "personal". */
export async function GET(request: Request) {
  try {
    const tab = new URL(request.url).searchParams.get("tab") || "weekly";
    const db = requireDb();

    if (tab === "weekly" || tab === "overall") {
      let q = db
        .from("game_sessions")
        .select("score, played_at, users!inner(name, organization)")
        .order("score", { ascending: false })
        .limit(tab === "weekly" ? 20 : 50);
      if (tab === "weekly") q = q.gte("played_at", weekStartIso());
      const { data, error } = await q;
      if (error) throw dbFailure(error, "rankings");
      const rows = ((data ?? []) as unknown as Row[]).map((r) => ({
        name: r.users?.name ?? "",
        organization: r.users?.organization ?? "",
        score: r.score,
        playedAt: r.played_at,
      }));
      return NextResponse.json({ rows });
    }

    if (tab === "personal") {
      const me = await currentUser();
      if (!me) throw new ApiError(401, "로그인하면 내 기록을 볼 수 있어요.", "unauthenticated");
      const { data, error } = await db
        .from("game_sessions")
        .select("score, played_at")
        .eq("user_id", me.id)
        .order("score", { ascending: false })
        .limit(50);
      if (error) throw dbFailure(error, "personal");
      return NextResponse.json({
        rows: (data ?? []).map((r) => ({ name: me.name, organization: me.organization, score: r.score, playedAt: r.played_at })),
      });
    }

    if (tab === "organization") {
      const { data, error } = await db.from("users").select("name, organization, high_score, updated_at").order("high_score", { ascending: false });
      if (error) throw dbFailure(error, "org");
      const best = new Map<string, { name: string; organization: string; score: number; playedAt: string }>();
      for (const u of data ?? []) {
        const org = String(u.organization ?? "");
        const s = Number(u.high_score ?? 0);
        if (!best.has(org) || best.get(org)!.score < s) best.set(org, { name: String(u.name), organization: org, score: s, playedAt: String(u.updated_at) });
      }
      return NextResponse.json({ rows: Array.from(best.values()).sort((a, b) => b.score - a.score) });
    }
    throw new ApiError(400, "알 수 없는 탭이에요.");
  } catch (error) {
    return fail(error);
  }
}
