/**
 * 網站正式網址 —— 通知信連結、行事曆、Open Graph 全都讀這裡。
 *
 * 順序（由上往下找，找到就用）：
 *   1. APPOINTMENT_BASE_URL          自己指定的網址（正式上線後請一定要設，網域換了也只改這裡）
 *   2. VERCEL_PROJECT_PRODUCTION_URL Vercel 的固定正式網址（部署時自動帶入）
 *   3. VERCEL_URL                    Vercel 這一次部署的臨時網址（每次部署都不一樣，最後手段）
 *   4. http://localhost:3100         本機開發
 *
 * 有 2、3 這兩層保險，是為了避免忘了設 APPOINTMENT_BASE_URL 時，
 * 客戶收到的「管理我的預約」連結指向 localhost 而完全打不開。
 */
function resolveBaseUrl(): string {
  const explicit = process.env.APPOINTMENT_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) return `https://${vercelProd.replace(/\/+$/, "")}`;

  const vercelDeploy = process.env.VERCEL_URL?.trim();
  if (vercelDeploy) return `https://${vercelDeploy.replace(/\/+$/, "")}`;

  return "http://localhost:3100";
}

export const BASE_URL = resolveBaseUrl();
