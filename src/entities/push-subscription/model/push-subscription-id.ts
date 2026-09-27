const STORAGE_KEY = "dameokja.pushSubscriptionId";

export function readPushSubscriptionId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function savePushSubscriptionId(subscriptionId: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, subscriptionId);
  } catch {}
}

export function clearPushSubscriptionId(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
