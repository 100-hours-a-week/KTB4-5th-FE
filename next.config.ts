import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig = withSerwist({
  /* config options here */
} satisfies NextConfig);

export default nextConfig;
