import { NextResponse } from "next/server";
import { adminSetPin } from "@/lib/server/admin";
import { ApiError } from "@/lib/server/db";
import { assertSameOrigin, fail, readJson } from "@/lib/server/respond";
import { requireAdmin } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireAdmin();
    const body = await readJson<{ name?: unknown; pin?: unknown }>(request);
    if (typeof body.name !== "string" || typeof body.pin !== "string") throw new ApiError(400, "이름과 PIN이 필요해요.");
    const target = await adminSetPin(actor, body.name, body.pin);
    return NextResponse.json({ ok: true, name: target.name });
  } catch (error) {
    return fail(error);
  }
}
