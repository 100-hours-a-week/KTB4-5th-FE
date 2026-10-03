export function isMswEnabled() {
  return (
    process.env.NEXT_PUBLIC_MSW === "true" &&
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT !== "production" &&
    (process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === "dev")
  );
}
