import type { Metadata } from "next";
import { SITE_URL, SOCIAL } from "@/config/owner";
import LineRedirect from "./LineRedirect";

// 2026-09-28：分享用的「加邱姐 LINE」網址。直接貼 line.me 連結，LINE／FB 只會顯示制式的
// 「Add LINE friend」預覽；改貼這頁，預覽就是邱姐照片＋自訂標題，點開後再自動跳去加好友。
// 注意：不能用伺服器端 redirect()，預覽爬蟲會跟著跳到 line.me，就又變回制式預覽。
const OG_IMAGE = `${SITE_URL}/site/line-og.png`;
const TITLE = "加邱姐 LINE｜買房試算、物件一次看";
const DESCRIPTION = "高雄房仲邱姐（邱靜慧）LINE 官方帳號：買得起多少、青安 3.0、寬限期試算，最新物件一次看。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/line`,
    siteName: "高雄房仲邱姐",
    locale: "zh_TW",
    type: "website",
    images: [{ url: OG_IMAGE, width: 800, height: 800, alt: "加邱姐 LINE" }],
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
};

export default function LinePage() {
  return <LineRedirect href={SOCIAL.lineOA} />;
}
