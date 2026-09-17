import "client-only";

export type PushNotificationErrorCode =
  | "MISSING_PUBLIC_KEY"
  | "PERMISSION_DENIED"
  | "PERMISSION_DISMISSED"
  | "UNSUPPORTED";

export class PushNotificationError extends Error {
  readonly code: PushNotificationErrorCode;

  constructor(code: PushNotificationErrorCode, message: string) {
    super(message);
    this.name = "PushNotificationError";
    this.code = code;
  }
}

export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function getPushNotificationPermission(): NotificationPermission | null {
  return isPushNotificationSupported() ? Notification.permission : null;
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  assertPushNotificationSupport();

  const registration = await navigator.serviceWorker.ready;

  return registration.pushManager.getSubscription();
}

export async function subscribeToPushNotifications(): Promise<PushSubscription> {
  assertPushNotificationSupport();

  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;

  if (!publicKey) {
    throw new PushNotificationError(
      "MISSING_PUBLIC_KEY",
      "웹 푸시 공개 키가 설정되지 않았습니다.",
    );
  }

  const permission = await Notification.requestPermission();

  if (permission === "denied") {
    throw new PushNotificationError(
      "PERMISSION_DENIED",
      "브라우저에서 알림 권한이 차단되었습니다.",
    );
  }

  if (permission !== "granted") {
    throw new PushNotificationError(
      "PERMISSION_DISMISSED",
      "알림 권한 요청이 완료되지 않았습니다.",
    );
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription && !isSubscriptionExpiring(existingSubscription)) {
    return existingSubscription;
  }

  if (existingSubscription) {
    await existingSubscription.unsubscribe();
  }

  return registration.pushManager.subscribe({
    applicationServerKey: base64UrlToUint8Array(publicKey),
    userVisibleOnly: true,
  });
}

export async function unsubscribeFromPushNotifications(): Promise<PushSubscriptionJSON | null> {
  const subscription = await getCurrentPushSubscription();

  if (!subscription) {
    return null;
  }

  const subscriptionSnapshot = subscription.toJSON();
  await subscription.unsubscribe();

  return subscriptionSnapshot;
}

function assertPushNotificationSupport(): void {
  if (!isPushNotificationSupported()) {
    throw new PushNotificationError(
      "UNSUPPORTED",
      "이 브라우저는 웹 푸시 알림을 지원하지 않습니다.",
    );
  }
}

function isSubscriptionExpiring(subscription: PushSubscription): boolean {
  if (!subscription.expirationTime) {
    return false;
  }

  const fiveMinutes = 5 * 60 * 1000;

  return subscription.expirationTime <= Date.now() + fiveMinutes;
}

function base64UrlToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}
