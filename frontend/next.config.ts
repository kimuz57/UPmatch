import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // อนุญาตให้อุปกรณ์ในวง LAN เช่น iPad เข้าถึง Next.js dev resources (HMR, chunks, styles) ได้
  allowedDevOrigins: [
    "localhost",
    "localhost:3003",
    "127.0.0.1",
    "127.0.0.1:3003",
    "192.168.1.109",
    "192.168.1.109:3003",
    "192.168.1.*",
    "*.local",
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
  // เพิ่มส่วนนี้เพื่อส่งต่อ Request ไปยัง Go Fiber (พอร์ต 8080)
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:8080/api/v1/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:8080/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;