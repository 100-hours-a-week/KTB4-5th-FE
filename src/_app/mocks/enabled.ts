export function isMswEnabled() {
  return (
    process.env.NEXT_PUBLIC_MSW === "true" &&
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT !== "production" &&
    (process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === "dev")
  );
}

const MSW_PREFERENCE_KEY = "msw";

export function isMswActive() {
  if (!isMswEnabled()) return false;

  const isLocalDev = process.env.NODE_ENV === "development";

  try {
    const preference = new URLSearchParams(window.location.search).get("msw");
    if (preference === "on" || preference === "off") {
      localStorage.setItem(MSW_PREFERENCE_KEY, preference);
    }
    const stored = localStorage.getItem(MSW_PREFERENCE_KEY);
    return stored === null ? isLocalDev : stored === "on";
  } catch {
    return isLocalDev;
  }
}
