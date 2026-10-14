import { NextResponse } from "next/server";
import { dbFailure, requireDb } from "@/lib/server/db";
import { verifyLogin } from "@/lib/server/pin";
import { assertSameOrigin, clientIp, fail, readJson } from "@/lib/server/respond";
import { clearSessionCookie, currentUser, setSessionCookie } from "@/lib/server/session";

export const dynamic = "force-dynamic";

async function withScore(id: string) {
  const { data, error } = await requireDb().from("users").select("high_score, created_at").eq("id", id).maybeSingle();
  if (error) throw dbFailure(error, "user score");
  return { highScore: Number(data?.high_score ?? 0), createdAt: String(data?.created_at ?? "") };
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({ user: { id: user.id, name: user.name, organization: user.organization, ...(await withScore(user.id)) } });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJson<{ name?: unknown; pin?: unknown }>(request);
    const { user, pinHash } = await verifyLogin(body.name, body.pin, clientIp(request));
    const { data } = await requireDb().from("users").select("organization").eq("id", user.id).maybeSingle();
    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, organization: String(data?.organization ?? ""), ...(await withScore(user.id)) },
    });
    setSessionCookie(response, user.id, pinHash);
    return response;
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    return fail(error);
  }
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
