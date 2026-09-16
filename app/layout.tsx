import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";

import { QueryProvider } from "@/_app/providers/query-provider";
import "@/_app/styles/globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "다먹자",
  description: "냉장고 식재료 관리 서비스",
  applicationName: "다먹자",
  appleWebApp: {
    capable: true,
    title: "다먹자",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body>
          <QueryProvider>
            <div className="app-viewport memo-paper">{children}</div>
          </QueryProvider>
      </body>
    </html>
  );
}
