import "server-only";
import { ApiError, dbFailure, requireDb } from "@/lib/server/db";
import { setPin } from "@/lib/server/pin";
import type { SessionUser } from "@/lib/server/session";

const PRIVILEGED = new Set(["admin", "super_admin"]);

/**
 * Admin sets another user's PIN. Admins may not touch admin/super_admin accounts
 * (only super_admin can), so an admin cannot take over a higher account.
 * There is intentionally no role-change endpoint in this app.
 */
export async function adminSetPin(actor: SessionUser, targetName: string, pin: string): Promise<{ id: string; name: string }> {
  const db = requireDb();
  const { data, error } = await db.from("users").select("id, name, role, is_admin").eq("name", targetName.trim()).maybeSingle();
  if (error) throw dbFailure(error, "admin target");
  if (!data) throw new ApiError(404, "그 이름의 사용자가 없어요.");
  const targetPrivileged = PRIVILEGED.has(String(data.role ?? "")) || data.is_admin === true;
  if (targetPrivileged && actor.role !== "super_admin" && data.id !== actor.id) {
    throw new ApiError(403, "관리자 계정의 PIN은 최고 관리자만 바꿀 수 있어요.");
  }
  await setPin(String(data.id), pin);
  return { id: String(data.id), name: String(data.name) };
}
