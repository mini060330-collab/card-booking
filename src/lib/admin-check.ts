/**
 * 後台權限檢查 —— 只有白名單信箱過得了。
 *
 * 名單設在 `.env.local` 的 `ADMIN_EMAILS`（逗號分隔可多組）。
 */
import { cookies } from "next/headers";
import { auth, adminEmails } from "@/auth";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-password";

export type AdminCheckArgs = {
  email: string;
  userId: string;
};

export async function getAdminCheckArgs(): Promise<AdminCheckArgs> {
  const session = await auth();
  const u = (session?.user || {}) as { email?: string; id?: string };
  return { email: u.email || "", userId: u.id || "" };
}

/**
 * 當前登入者是不是管理員。
 *
 * 🔴 沒設白名單時回 false（不是 true）—— 忘了設定的後果應該是「進不去」，
 *    不是「全世界都進得去」。
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  // 路徑一：密碼登入（設了 ADMIN_PASSWORD 才有）
  const store = await cookies();
  if (verifyAdminSessionToken(store.get(ADMIN_SESSION_COOKIE)?.value)) return true;

  // 路徑二：Google 帳號登入 + 信箱白名單
  const { email } = await getAdminCheckArgs();
  if (!email) return false;
  const list = adminEmails();
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}
