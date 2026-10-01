import Script from "next/script";

import { siteConfig } from "@/shared/config";

export function GoogleAnalytics() {
  if (process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT !== "production") {
    return null;
  }

  const { gaMeasurementId } = siteConfig;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaMeasurementId}');
        `}
      </Script>
    </>
  );
}
