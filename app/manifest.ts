import type { MetadataRoute } from "next";

import { siteConfig } from "@/shared/config";
import { routes } from "@/shared/routes";

export default function manifest(): MetadataRoute.Manifest {
  return {
    short_name: siteConfig.name,
    name: siteConfig.manifestName,
    description: siteConfig.description,
    start_url: routes.home,
    scope: routes.home,
    display: "standalone",
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
