import { NextResponse } from "next/server";
import { issueGameToken } from "@/lib/server/gameToken";
import { assertSameOrigin, fail } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    return NextResponse.json({ token: issueGameToken(user.id) });
  } catch (error) {
    return fail(error);
  }
}
