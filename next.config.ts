import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

// 로컬 전용 Dev Server 프록시
const LOCAL_BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ?? "http://localhost:8080";

const nextConfig = withSerwist({
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
