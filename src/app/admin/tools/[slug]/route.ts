/**
 * /admin/tools/[slug] —— 邱姐專用的「完整版」試算工具。
 *
 * 前台 /tools 給客人的是精簡版（不教殺價、不寫服務費可議）；
 * 完整版放在 src/private-tools/（不在 public/，外面連不到），登入後台才讀得到，
 * 讓邱姐帶看、面談時拿手機現場操作給客人看。
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/admin-check";

export const dynamic = "force-dynamic";

// 白名單：網址名稱 → 檔名。不在清單裡的一律 404，避免讀到別的檔案
const FILES: Record<string, string> = {
  qingan: "qingan.html",
  afford: "afford.html",
  fees: "fees.html",
  grace: "grace.html",
  check: "check.html",
  seller: "seller.html",
};

// 注入每頁最上方的專用列：標明是完整版、一鍵回工具箱
const BAR = `
<div style="position:sticky;top:0;z-index:999;display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:8px 14px;background:#4A2A24;color:#FFF4EE;font:600 14px 'Noto Sans TC','Microsoft JhengHei',sans-serif">
  <a href="/admin/tools" style="color:#FFF4EE;text-decoration:none">← 邱姐工具箱</a>
  <span style="font-size:12px;opacity:.8">完整版・僅限登入</span>
</div>`;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.redirect(new URL(`/admin/login?next=/admin/tools/${encodeURIComponent(slug)}`, _req.url));
  }
  const file = FILES[slug];
  if (!file) return new NextResponse("Not found", { status: 404 });

  let body = await readFile(path.join(process.cwd(), "src/private-tools", file), "utf8");
  // 舊版頁面（例如屋主實拿）沒寫手機顯示設定，補上，不然手機上字會縮很小
  if (!/name=["']viewport["']/i.test(body)) {
    body = `<meta name="viewport" content="width=device-width, initial-scale=1">\n` + body;
  }
  // 有 <body> 就插在它後面；沒有就插在最後一個 </style> 後面（瀏覽器會自動當成內文開頭）
  if (/<body[^>]*>/i.test(body)) {
    body = body.replace(/<body([^>]*)>/i, (m) => m + BAR);
  } else {
    const i = body.lastIndexOf("</style>");
    body = i >= 0 ? body.slice(0, i + 8) + BAR + body.slice(i + 8) : BAR + body;
  }
  return new NextResponse(body, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
