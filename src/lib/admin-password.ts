/**
 * 後台密碼登入 —— Google 帳號登入之外的另一條路。
 *
 * 原本的設計是 Google 登入 + 信箱白名單（見 src/auth.ts），安全性較好，
 * 但要先去 Google Cloud 開專案、設 OAuth，步驟很多。
 * 這裡補一個密碼登入，設 `ADMIN_PASSWORD` 就能用，兩種方式並存：
 * 任一通過即視為管理員（見 src/lib/admin-check.ts）。
 *
 * 🔴 沒設 ADMIN_PASSWORD 時一律不通過 —— 忘了設定的後果是「進不去」，
 *    不是「全世界都進得去」。
 */
import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";

/** 登入有效期（天）。過期要重新輸入密碼。 */
const TTL_DAYS = 14;

function signingSecret(): string | null {
  const configured =
    process.env.APPOINTMENT_TOKEN_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "";
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : "dev-only-insecure-secret";
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

/** 有沒有啟用密碼登入這條路。 */
export function isAdminPasswordEnabled(): boolean {
  return adminPassword().length > 0;
}

function sign(payload: string): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** 長度固定的比對，避免用回應時間逐字猜密碼。 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** 密碼對不對。沒設定密碼一律回 false。 */
export function verifyAdminPassword(input: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  return safeEqual(input, expected);
}

/**
 * 產生登入憑證。
 * 內含目前密碼的指紋 —— 改密碼後舊的登入狀態會自動失效。
 */
export function createAdminSessionToken(): string | null {
  const secret = signingSecret();
  const password = adminPassword();
  if (!secret || !password) return null;
  const fingerprint = createHmac("sha256", secret).update(password).digest("base64url").slice(0, 16);
  const exp = Math.floor(Date.now() / 1000) + TTL_DAYS * 86400;
  const payload = `${fingerprint}.${exp}`;
  const sig = sign(payload);
  return sig ? `${payload}.${sig}` : null;
}

/** 驗證登入憑證。過期、被竄改、或密碼已更換都回 false。 */
export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const secret = signingSecret();
  const password = adminPassword();
  if (!secret || !password) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [fingerprint, expPart, sig] = parts;

  const exp = Number(expPart);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const expectedSig = sign(`${fingerprint}.${expPart}`);
  if (!expectedSig || !safeEqual(sig, expectedSig)) return false;

  // 密碼換過的話指紋對不上，舊憑證即失效
  const expectedFingerprint = createHmac("sha256", secret).update(password).digest("base64url").slice(0, 16);
  return safeEqual(fingerprint, expectedFingerprint);
}

export const ADMIN_SESSION_MAX_AGE = TTL_DAYS * 86400;
