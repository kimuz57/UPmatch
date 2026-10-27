import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // อนุญาตให้อุปกรณ์ในวง LAN เช่น iPad เข้าถึง Next.js dev resources (HMR, chunks, styles) ได้
  allowedDevOrigins: [
    "localhost",
    "localhost:3003",
    "127.0.0.1",
    "127.0.0.1:3003",
    "192.168.*",
    "*.local",
    ...(process.env.ALLOWED_DEV_ORIGINS
      ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
      : []),
  ],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // ส่งต่อ Request ไปยัง Go Fiber ตามค่าที่ตั้งไว้ใน .env
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;