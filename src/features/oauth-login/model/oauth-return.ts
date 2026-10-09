import { clearCurrentRefrigeratorId } from "@/entities/refrigerator";

const OAUTH_PENDING_KEY = "dameokja:oauth-pending";

export function markOAuthLoginStarted(): void {
  clearCurrentRefrigeratorId();
  try {
    window.sessionStorage.setItem(OAUTH_PENDING_KEY, "1");
  } catch {
    return;
  }
}

export function consumeOAuthLoginStarted(): boolean {
  try {
    const isPending = window.sessionStorage.getItem(OAUTH_PENDING_KEY) !== null;
    window.sessionStorage.removeItem(OAUTH_PENDING_KEY);
    return isPending;
  } catch {
    return false;
  }
}
