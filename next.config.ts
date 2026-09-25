import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

// 로컬 전용 Dev Server 프록시
const LOCAL_BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ?? "http://localhost:8080";

const nextConfig = withSerwist({
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/serwist/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Content-Security-Policy", value: "script-src 'self'" },
        ],
      },
    ];
  },
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${LOCAL_BACKEND_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
} satisfies NextConfig);

export default nextConfig;
