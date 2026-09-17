import type { MetadataRoute } from "next";

import { routes } from "@/shared/routes";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: routes.home,
    short_name: "다먹자",
    name: "다먹자 앱",
    description: "A Progressive Web App built with Next.js",
    start_url: routes.home,
    scope: routes.home,
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f5f2",
    theme_color: "#f7f5f2",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
