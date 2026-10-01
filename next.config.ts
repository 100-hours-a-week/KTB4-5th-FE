import { withSerwist } from "@serwist/turbopack";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// 로컬 전용 Dev Server 프록시
const LOCAL_BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ?? "http://localhost:8080";
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;

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

export default withSentryConfig(nextConfig, {
  org: "kakaotechbootcamp",
  project: "dameokja-fe",
  authToken: SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: {
    disable: !SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
  release: {
    name: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    create: Boolean(SENTRY_AUTH_TOKEN),
    finalize: Boolean(SENTRY_AUTH_TOKEN),
  },
});
