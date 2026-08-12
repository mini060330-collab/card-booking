import type { Metadata } from "next";
import Link from "next/link";
import "./site.css";
import { OWNER, SOCIAL, SITE_URL } from "@/config/owner";

const OG_IMAGE = `${SITE_URL}/site/og-image.png`;

export const metadata: Metadata = {
  title: "邱靜慧｜高雄房仲 三民．左營．鳳山．苓雅 資產配置與房產顧問｜台慶不動產",
  description:
    "高雄房仲邱靜慧（邱姐），深耕三民區、左營區、鳳山區、苓雅區，113、114年連續百萬菁英戰將。提供資產配置、稅務諮詢、簡易裝潢等房產顧問服務，可線上預約或加LINE諮詢。",
  keywords: ["高雄房仲", "三民區房仲", "左營區房仲", "鳳山區房仲", "苓雅區房仲", "邱靜慧", "台慶不動產", "資產配置", "房地合一稅"],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "邱靜慧｜高雄房仲 三民．左營．鳳山．苓雅 資產配置與房產顧問",
    description: "高雄房仲邱靜慧，113、114年連續百萬菁英戰將。提供資產配置、稅務諮詢、簡易裝潢等房產顧問服務。",
    url: SITE_URL,
    siteName: "邱靜慧｜高雄房仲",
    locale: "zh_TW",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "邱靜慧 高雄房仲" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "邱靜慧｜高雄房仲 三民．左營．鳳山．苓雅",
    description: "113、114年連續百萬菁英戰將。資產配置、稅務諮詢、簡易裝潢。",
    images: [OG_IMAGE],
  },
};

const AREAS = [
  { icon: "民", name: "三民區", text: "學區行情、生活圈動態即時掌握，自住換屋、置產每一步都幫你精算。" },
  { icon: "左", name: "左營區", text: "重劃區發展、捷運周邊行情變化緊盯不放，首購、換屋、置產都能給你精準判斷。" },
  { icon: "鳳", name: "鳳山區", text: "在地深耕多年，物件與行情第一手消息不漏接，累積深厚在地口碑。" },
  { icon: "苓", name: "苓雅區", text: "市中心商圈行情熟悉，套房、電梯大樓買賣租賃，投報率怎麼算都幫你想清楚。" },
];

const AWARDS = [
  { year: "113．114", name: "百萬菁英戰將" },
  // 2026-08-12 邱姐：精英獎是 2026 年（民國 115）。用民國年跟上下兩行對齊。
  { year: "115", name: "精英獎" },
  { year: "112", name: "最佳新秀獎" },
];

const SERVICES = [
  { num: "01", name: "資產配置", text: "什麼時候買、什麼時候賣、資金怎麼配置，依你的財務狀況與目標，給你最有利的判斷。" },
  { num: "02", name: "稅務諮詢", text: "房地合一稅、土地增值稅，事先算清楚，才不會讓你多繳一分冤枉錢。" },
  { num: "03", name: "簡易裝潢", text: "交屋後的輕裝潢、局部翻新，信任的師傅、精準的預算控管，我幫你把關到底。" },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: OWNER.name,
  telephone: "+886-921-203-586",
  email: OWNER.email,
  address: { "@type": "PostalAddress", streetAddress: OWNER.address, addressCountry: "TW" },
  areaServed: ["高雄市三民區", "高雄市左營區", "高雄市鳳山區", "高雄市苓雅區"],
  worksFor: { "@type": "Organization", name: OWNER.company },
  award: "113、114年連續百萬菁英戰將",
  url: SITE_URL,
  image: OG_IMAGE,
};

export default function HomePage() {
  return (
    <div className="qj-site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      <nav className="qj-nav">
        <div className="container">
          <div className="qj-brand">{OWNER.name}<span> ｜{OWNER.company}</span></div>
          <div className="topnav-links">
            <a href="#area">服務區域</a>
            <a href="#record">戰績</a>
            <a href="#services">服務項目</a>
            <a href="#booking">預約諮詢</a>
          </div>
          <div className="topnav-cta">
            <a className="btn-tel-outline" href={`tel:${OWNER.phoneRaw}`}>電話</a>
            <a className="btn-line" href={SOCIAL.line} target="_blank" rel="noreferrer">加LINE</a>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="container">
          <div className="hero-photo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="hero-photo" src="/site/qiu-jinghui.png" width={220} height={220} alt="邱靜慧 高雄房仲" />
          </div>
          <div className="hero-text">
            <span className="hero-eyebrow">高雄三民邱姐－{OWNER.name}</span>
            <h1>{OWNER.name}</h1>
            <p className="role">深耕高雄三民．左營．鳳山．苓雅，用市場數據和經驗，幫你做出最有利的決定</p>
            <p className="tagline">113、114年連續百萬菁英戰將。專精資產配置、稅務規劃與簡易裝潢，替你把關每一個關鍵決定。</p>
            <div className="hero-cta">
              <Link className="btn btn-tel-lg" href="/card/booking">線上預約諮詢</Link>
              <a className="btn btn-line-lg" href={SOCIAL.line} target="_blank" rel="noreferrer">加LINE諮詢</a>
            </div>
          </div>
        </div>
      </header>

      <section id="area">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Service Area</div>
            <h2>服務區域</h2>
            <p>主要服務高雄三民區、左營區、鳳山區、苓雅區，行情脈動、生活機能第一手掌握，換屋、置產、收租，每個決定都幫你算清楚。</p>
          </div>
          <div className="area-grid">
            {AREAS.map((a) => (
              <div className="area-card" key={a.name}>
                <div className="icon">{a.icon}</div>
                <h3>{a.name}</h3>
                <p>{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="record" className="section-alt">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Track Record</div>
            <h2>戰績實績</h2>
            <p>不是靠運氣，是每一筆交易都經得起考驗換來的。</p>
          </div>
          <div className="record-banner">
            <div className="record-badge">2<small>連續年度</small></div>
            <div className="record-text">
              <h3>連續兩年 百萬菁英戰將</h3>
              <p>113年、114年連續獲選百萬菁英戰將——這是每一次替客戶把關、把數字算清楚，換來的信任。</p>
            </div>
          </div>
          <div className="award-list">
            {AWARDS.map((a) => (
              <div className="award-item" key={a.name}>
                <span className="award-year">{a.year}</span>{a.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Services</div>
            <h2>服務項目</h2>
            <p>買賣房子牽動的不只是價格，更多的是判斷力——我幫你把關鍵環節都想在前面。</p>
          </div>
          <div className="service-grid">
            {SERVICES.map((s) => (
              <div className="service-card" key={s.num}>
                <div className="num">{s.num}</div>
                <h3>{s.name}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="booking" className="section-alt">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Booking</div>
            <h2>預約諮詢</h2>
            <p>買賣、租賃、資產規劃，任何決定前，先找我聊聊——精準判斷，從第一次諮詢就開始。</p>
          </div>
          <div className="booking-wrap">
            <div className="booking-form">
              <h3 style={{ color: "var(--taiching-navy)", marginBottom: 12 }}>線上預約系統</h3>
              <p style={{ fontSize: "0.95rem", color: "var(--text-soft)", marginBottom: 20 }}>
                自己挑一個方便的時段，留下你想處理的問題，我會依你的需求先做好功課再跟你聊。
              </p>
              <ul style={{ marginBottom: 24, fontSize: "0.95rem", lineHeight: 2 }}>
                <li>· 平日 10:00–18:00，15 分鐘一格自己選</li>
                <li>· 門市面談、電話聯繫或線上視訊</li>
                <li>· 買房、賣房、資產配置、稅務、裝潢都能談</li>
                <li>· 約好之後想改時間，自己線上改就好</li>
              </ul>
              <Link className="btn btn-tel-lg" href="/card/booking" style={{ width: "100%", justifyContent: "center" }}>
                前往線上預約
              </Link>
              <p className="form-note">也可以先看我的<Link href="/card" style={{ textDecoration: "underline" }}>電子名片</Link>。</p>
            </div>
            <div className="booking-side">
              <h3>更快的方式</h3>
              <p>比起填表，直接加LINE或打電話，通常能更快得到回覆。</p>
              <a className="btn btn-line-lg" href={SOCIAL.line} target="_blank" rel="noreferrer">加LINE諮詢</a>
              <a className="btn btn-tel-lg" href={`tel:${OWNER.phoneRaw}`}>電話 {OWNER.phone}</a>
              <div className="contact-line">門市：{OWNER.address}</div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-brand">{OWNER.name}｜{OWNER.company}</div>
          <p>電話 / LINE：{OWNER.phone}　｜　門市：{OWNER.address}</p>
          <p>服務區域：高雄市三民區．左營區．鳳山區．苓雅區　｜　113、114年連續百萬菁英戰將</p>
        </div>
      </footer>

      <a className="float-line" href={SOCIAL.line} target="_blank" rel="noreferrer">加LINE</a>
    </div>
  );
}
