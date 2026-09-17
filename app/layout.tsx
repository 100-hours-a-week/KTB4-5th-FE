import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import { NavigationHistoryTracker } from "@/_app/providers/navigation-history-tracker";
import { QueryProvider } from "@/_app/providers/query-provider";
import { siteConfig } from "@/shared/config";
import "@/_app/styles/globals.css";

export const metadata: Metadata = {
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.defaultTitle,
    template: siteConfig.titleTemplate,
  },
  description: siteConfig.description,
  appleWebApp: {
    capable: true,
    title: siteConfig.defaultTitle,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: {
      default: siteConfig.defaultTitle,
      template: siteConfig.titleTemplate,
    },
    description: siteConfig.description,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: {
      default: siteConfig.defaultTitle,
      template: siteConfig.titleTemplate,
    },
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f5f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
          <QueryProvider>
            <Suspense fallback={null}>
              <NavigationHistoryTracker />
            </Suspense>
            <div className="app-viewport memo-paper">{children}</div>
          </QueryProvider>
      </body>
    </html>
  );
}
