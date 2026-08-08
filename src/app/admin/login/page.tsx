import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isCurrentUserAdmin } from "@/lib/admin-check";
import { isAdminPasswordEnabled, verifyAdminPassword, createAdminSessionToken, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE } from "@/lib/admin-password";
import { OWNER } from "@/config/owner";

export const metadata = { title: "後台登入", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function login(formData: FormData) {
  "use server";

  const password = String(formData.get("password") || "");
  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?e=1");
  }

  const token = createAdminSessionToken();
  if (!token) {
    redirect("/admin/login?e=2");
  }

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  redirect("/admin/appointments");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (await isCurrentUserAdmin()) redirect("/admin/appointments");

  const { e } = await searchParams;
  const enabled = isAdminPasswordEnabled();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0F1621",
        fontFamily: '"Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif',
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#182231",
          border: "1px solid #27364B",
          borderRadius: 16,
          padding: 32,
          color: "#E6EDF7",
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: 2, color: "#8FA3BF", fontWeight: 700 }}>
          {OWNER.name}｜預約管理
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "10px 0 6px" }}>後台登入</h1>
        <p style={{ fontSize: 13.5, color: "#8FA3BF", lineHeight: 1.7, margin: "0 0 22px" }}>
          這裡有客戶的姓名與電話，需要密碼才能檢視。
        </p>

        {e === "1" ? (
          <div style={{ background: "#3A1D22", border: "1px solid #7A3038", color: "#FFB4BC", borderRadius: 10, padding: "10px 14px", fontSize: 13.5, marginBottom: 16 }}>
            密碼不正確，請再試一次。
          </div>
        ) : null}
        {e === "2" ? (
          <div style={{ background: "#3A1D22", border: "1px solid #7A3038", color: "#FFB4BC", borderRadius: 10, padding: "10px 14px", fontSize: 13.5, marginBottom: 16 }}>
            系統缺少簽章金鑰（APPOINTMENT_TOKEN_SECRET），請先設定。
          </div>
        ) : null}

        {enabled ? (
          <form action={login}>
            <label htmlFor="password" style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
              後台密碼
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                borderRadius: 10,
                border: "1px solid #33455F",
                background: "#0F1621",
                color: "#E6EDF7",
                fontSize: 15,
                marginBottom: 16,
              }}
            />
            <button
              type="submit"
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 10,
                border: "none",
                background: "#F5A91D",
                color: "#1B2635",
                fontSize: 15.5,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              登入
            </button>
          </form>
        ) : (
          <div style={{ background: "#2A2113", border: "1px solid #6B5420", color: "#F3D08A", borderRadius: 10, padding: "12px 14px", fontSize: 13.5, lineHeight: 1.8 }}>
            尚未設定後台密碼。<br />
            請在 <code style={{ color: "#FFD79A" }}>.env.local</code> 加入{" "}
            <code style={{ color: "#FFD79A" }}>ADMIN_PASSWORD</code>，或改用 Google 帳號登入。
          </div>
        )}
      </div>
    </main>
  );
}
