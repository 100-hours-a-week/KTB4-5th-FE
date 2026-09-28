export function getSentryOptions() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const environment =
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV;

  return {
    dsn,
    enabled: Boolean(dsn),
    environment,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: environment === "production" ? 0.1 : 1,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    },
  };
}
