"use client";

import { useEffect } from "react";

export default function LineRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f8ebe6", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 18, color: "#6e3228", marginBottom: 20 }}>正在帶你去加邱姐 LINE…</p>
        <a href={href} style={{ display: "inline-block", padding: "14px 32px", borderRadius: 999, background: "#06c755", color: "#fff", fontSize: 18, fontWeight: 700, textDecoration: "none" }}>
          沒有跳轉？點這裡加好友
        </a>
      </div>
    </main>
  );
}
