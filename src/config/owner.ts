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
  name: "王小明",
  /** 慣用稱呼（客戶怎麼叫你，出現在文案裡：「小明會與您聯繫」） */
  alias: "小明",
  /** 頭銜 */
  title: "OO 房屋資深經紀人",
  /** 手機（顯示用，含分隔線） */
  phone: "0900-000-000",
  /** 手機（純數字，撥號連結與 LINE 加好友用） */
  phoneRaw: "0900000000",
  /** 聯絡信箱（客戶回信會到這裡） */
  email: "your-email@example.com",
  /** 公司地址（「公司面談」這個選項會顯示它） */
  address: "台北市中正區範例路 1 號",
  /** 公司／品牌名 */
  company: "OO 房屋",
  /** 大頭照放 public/card/ 底下 */
  photoUrl: "/card/owner.jpg",
  /** 一句話介紹自己 */
  slogan: "10 年房仲實戰．專精中古屋買賣．把每一次成交都做成可複製的流程。",
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
