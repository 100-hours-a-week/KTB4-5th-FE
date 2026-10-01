import Script from "next/script";

import { siteConfig } from "@/shared/config";

export function MicrosoftClarity() {
  // 운영 배포에서만 수집한다. dev 배포·로컬 세션이 섞이지 않게 한다.
  if (process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT !== "production") {
    return null;
  }

  const { clarityProjectId } = siteConfig;

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${clarityProjectId}");
      `}
    </Script>
  );
}
