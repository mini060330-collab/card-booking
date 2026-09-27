/**
 * /admin/tools —— 邱姐工具箱（登入後才看得到）。
 *
 * 每個工具兩顆按鈕：
 *  - 「現場打開」＝完整版（/admin/tools/[slug]），帶看、面談時拿手機操作給客人看
 *  - 「傳給客人」＝前台精簡版（/tools/...）的連結，用 LINE 分享或複製
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-check";
import { SITE_URL } from "@/config/owner";
import ShareButton from "./ShareButton";

export const metadata: Metadata = {
  title: "邱姐工具箱",
  robots: { index: false, follow: false },
  appleWebApp: { title: "邱姐工具箱", capable: true, statusBarStyle: "default" },
};
export const dynamic = "force-dynamic";

type Tool = { slug: string; name: string; when: string; publicPath?: string; note?: string };

const BUYER: Tool[] = [
  { slug: "qingan", name: "青安 3.0 資格檢測", when: "首購客問「我能不能貸、貸多少」", publicPath: "/tools/qingan" },
  { slug: "afford", name: "買得起多少", when: "看房前先抓預算，避免白跑", publicPath: "/tools/afford" },
  { slug: "fees", name: "買房雜費一次算", when: "客人問「頭期款以外還要多少」", publicPath: "/tools/fees" },
  { slug: "check", name: "中古屋查核清單", when: "帶看前後，一項一項對給客人看", publicPath: "/tools/check" },
];
const OWNER_TOOLS: Tool[] = [
  { slug: "grace", name: "寬限期到期試算", when: "屋主月付要跳、在想要不要換屋／賣屋", publicPath: "/tools/grace" },
  { slug: "seller", name: "屋主實拿試算", when: "屋主問「賣掉我手上會剩多少」", note: "稅率還沒請代書核對，只給自己參考，先別傳給客人" },
];

const C = { bg: "#FFF4EE", card: "#FFFFFF", line: "#F1D9CF", ink: "#4A2A24", mid: "#7A5A52", main: "#A84A3E", pop: "#E3A45E" };

function ToolCard({ t }: { t: Tool }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px 16px 14px", boxShadow: "0 2px 10px rgba(168,74,62,.06)" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{t.name}</div>
      <div style={{ fontSize: 13.5, color: C.mid, margin: "4px 0 12px", lineHeight: 1.6 }}>什麼時候用：{t.when}</div>
      {t.note ? (
        <div style={{ fontSize: 12.5, color: "#9A5B12", background: "#FBF1E2", borderRadius: 8, padding: "6px 10px", marginBottom: 10 }}>⚠️ {t.note}</div>
      ) : null}
      <div style={{ display: "flex", gap: 8 }}>
        <a
          href={`/admin/tools/${t.slug}`}
          style={{ flex: 1, textAlign: "center", background: C.main, color: "#fff", fontWeight: 800, fontSize: 15.5, padding: "12px 8px", borderRadius: 12, textDecoration: "none" }}
        >
          現場打開
        </a>
        {t.publicPath ? <ShareButton url={`${SITE_URL}${t.publicPath}`} title={t.name} /> : null}
      </div>
    </div>
  );
}

export default async function AdminToolsPage() {
  if (!(await isCurrentUserAdmin())) redirect("/admin/login?next=/admin/tools");

  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: '"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif', padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12.5, letterSpacing: 2, color: C.main, fontWeight: 800 }}>邱姐專用</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: "2px 0 0" }}>我的工具箱</h1>
          </div>
          <a href="/admin/appointments" style={{ fontSize: 13, color: C.mid }}>預約管理 →</a>
        </div>
        <p style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.7, margin: "8px 0 18px" }}>
          「現場打開」是完整版，只有你登入看得到，帶看時拿手機操作給客人看。
          「傳給客人」是網站上的精簡版連結。
        </p>

        <h2 style={{ fontSize: 15, fontWeight: 800, color: C.main, margin: "0 0 10px" }}>買方用</h2>
        <div style={{ display: "grid", gap: 12 }}>{BUYER.map((t) => <ToolCard key={t.slug} t={t} />)}</div>

        <h2 style={{ fontSize: 15, fontWeight: 800, color: C.main, margin: "24px 0 10px" }}>屋主用</h2>
        <div style={{ display: "grid", gap: 12 }}>{OWNER_TOOLS.map((t) => <ToolCard key={t.slug} t={t} />)}</div>

        <div style={{ marginTop: 26, fontSize: 12.5, color: C.mid, lineHeight: 1.8, background: "#fff", border: `1px dashed ${C.line}`, borderRadius: 12, padding: "12px 14px" }}>
          📱 手機小技巧：用 Safari／Chrome 打開這頁 → 分享 →「加入主畫面」，以後點圖示就直接開。
          登入一次可以用 14 天，過期再輸入一次密碼就好。
        </div>
      </div>
    </main>
  );
}
