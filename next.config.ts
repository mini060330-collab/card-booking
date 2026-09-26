import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 名片頁的大頭照如果放外部網址（例如 CDN），把網域加進來
  images: { remotePatterns: [] },
  // 買房試算工具是 public/tools/ 底下的靜態頁，讓網址不用帶 .html
  async rewrites() {
    return [
      { source: "/tools", destination: "/tools/index.html" },
      { source: "/tools/:slug([a-z0-9-]+)", destination: "/tools/:slug.html" },
    ];
  },
};

export default nextConfig;
