import type { Metadata } from "next";
import BookingForm from "./BookingForm";

export const metadata: Metadata = {
  title: "線上預約｜邱靜慧（邱姐）",
  description: "預約與邱姐聊買房、賣房與租屋。選擇聯繫方式與時間，完成 Email 確認後正式成立。",
  robots: { index: false, follow: false },
};

export default function BookingPage() {
  return <BookingForm />;
}
