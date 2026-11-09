import * as Sentry from "@sentry/nextjs";

import { getSentryOptions } from "@/_app/monitoring";
import { installBrowserBackGuard } from "@/shared/lib/navigation-guard";

// Next.js의 popstate 처리보다 먼저 작성 중 이탈을 가로챈다.
installBrowserBackGuard();
Sentry.init(getSentryOptions());

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
