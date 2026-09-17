import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import { AppToastProvider } from "@/_app/providers/app-toast-provider";
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
          <AppToastProvider />
          <Suspense fallback={null}>
            <NavigationHistoryTracker />
          </Suspense>
          <div className="isolate mx-auto flex min-h-[100dvh] w-[min(100%,var(--app-max-width))] overflow-x-clip bg-app-bg [background-image:repeating-linear-gradient(0deg,transparent_0_25px,rgb(26_26_30_/_4.5%)_25px_26px)]">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
