/**
 * 👤 這個系統是誰的 —— 從這裡改，只改這一個檔
 *
 * 名片頁、預約表單、通知信、日曆邀請 全都讀這裡。
 * 把下面換成你自己的資料，整套系統就是你的了。
 *
 * ⚠️ 這個檔會進 Git。手機與 Email 填進去等於公開在網路上
 *    （名片本來就是要給人看的，但你如果不想被爬蟲收割，
 *      可以改成讀環境變數：process.env.OWNER_PHONE 之類）。
 */

export const OWNER = {
  /** 你的名字（正式全名，出現在通知信署名與日曆邀請） */
  name: "邱靜慧",
  /** 慣用稱呼（客戶怎麼叫你，出現在文案裡：「邱姐會與您聯繫」） */
  alias: "邱姐",
  /** 頭銜 */
  title: "台慶不動產 高雄房產顧問",
  /** 手機（顯示用，含分隔線） */
  phone: "0921-203-586",
  /** 手機（純數字，撥號連結與 LINE 加好友用） */
  phoneRaw: "0921203586",
  /** 聯絡信箱（客戶回信會到這裡） */
  email: "mini060330@gmail.com",
  /** 公司地址（「公司面談」這個選項會顯示它） */
  // TODO 邱姐：這裡要填門市的實際地址，客戶選「公司面談」時會看到
  address: "高雄市三民區．左營區．鳳山區．苓雅區",
  /** 公司／品牌名 */
  company: "台慶不動產",
  /** 大頭照放 public/card/ 底下 */
  photoUrl: "/card/owner.jpg",
  /** 一句話介紹自己 */
  slogan: "113、114 年連續百萬菁英戰將．專精資產配置、稅務諮詢與簡易裝潢．把每個關鍵決定都幫你算清楚。",
} as const;

/** 社群連結 —— 用不到的留空字串，畫面會自動不顯示 */
export const SOCIAL = {
  line: `https://line.me/R/ti/p/~${OWNER.phoneRaw}`,
  fb: "",
  yt: "",
  ig: "",
} as const;

/** LINE 加好友 QR 圖（放 public/card/ 底下）。null = 不顯示 QR 區 */
export const LINE_QR: string | null = null;

/** 網站網址（通知信裡的連結、Open Graph 用） */
export const SITE_URL = process.env.APPOINTMENT_BASE_URL || "http://localhost:3000";
