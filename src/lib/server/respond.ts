import "server-only";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/server/db";

export function fail(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error("api failed", error instanceof Error ? error.message : error);
  return NextResponse.json({ error: "요청을 처리하지 못했어요." }, { status: 500 });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "요청 형식이 잘못되었어요.");
  }
}

/** Reject cross-site state-changing requests (defence in depth on top of SameSite=Lax). */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return; // same-origin fetch from old browsers / server tools
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    if (host && new URL(origin).host === host) return;
  } catch {
    /* fallthrough */
  }
  throw new ApiError(403, "허용되지 않은 요청이에요.");
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
