"use client";

import { useState } from "react";

/** 手機上叫出系統分享（可直接選 LINE）；電腦上改成複製連結 */
export default function ShareButton({ url, title }: { url: string; title: string }) {
  const [done, setDone] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title}，點開就能算：`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      // 使用者取消分享，不用處理
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      style={{ flex: 1, background: "#FFF4EE", color: "#A84A3E", border: "1.5px solid #E9A99A", fontWeight: 800, fontSize: 15.5, padding: "12px 8px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}
    >
      {done ? "已複製連結" : "傳給客人"}
    </button>
  );
}
