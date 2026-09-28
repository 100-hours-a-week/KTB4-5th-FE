import * as Sentry from "@sentry/nextjs";

import { getSentryOptions } from "@/_app/monitoring";

Sentry.init(getSentryOptions());

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
