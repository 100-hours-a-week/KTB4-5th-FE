import "client-only";

import { savePushSubscriptionId } from "@/entities/push-subscription";
import { ApiError, SessionExpiredError } from "@/shared/api";

import {
  getVapidPublicKey,
  PUSH_ENDPOINT_IN_USE_ERROR_CODE,
  registerPushSubscription,
  type RegisterPushSubscriptionRequest,
} from "../api/push-subscription";

type ApplicationServerKey = ReturnType<typeof base64UrlToUint8Array>;

// SW 설치가 실패하면 ready가 끝나지 않아 버튼이 계속 대기 상태로 남는다.
const SERVICE_WORKER_READY_TIMEOUT_MS = 10_000;

export type PushNotificationErrorCode = "UNSUPPORTED";

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

/**
 * - `supported`: 권한 요청과 구독을 바로 진행할 수 있다.
 * - `needs-install`: iOS Safari 탭처럼 홈 화면에 추가해 standalone으로 열어야 푸시를 쓸 수 있다.
 * - `unsupported`: 설치해도 푸시를 쓸 수 없는 환경이다.
 */
export type PushNotificationSupport =
  "supported" | "needs-install" | "unsupported";

export function getPushNotificationSupport(): PushNotificationSupport {
  if (isPushNotificationSupported()) {
    return "supported";
  }

  if (typeof window !== "undefined" && isIosDevice() && !isStandalone()) {
    return "needs-install";
  }

  return "unsupported";
}

export function getPushNotificationPermission(): NotificationPermission | null {
  return isPushNotificationSupported() ? Notification.permission : null;
}

export type PushPermissionResult = "granted" | "denied" | "dismissed";

// 사용자 제스처가 살아 있을 때 불러야 하므로 클릭 핸들러에서 가장 먼저 호출한다.
// 한 번 `denied`가 되면 코드로 다시 물어볼 수 없다.
export async function requestPushPermission(): Promise<PushPermissionResult> {
  assertPushNotificationSupport();

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    return "granted";
  }

  return permission === "denied" ? "denied" : "dismissed";
}

export type RegisterWebPushResult =
  | { status: "subscribed"; subscriptionId: string }
  | { status: "error"; step: "key" | "subscribe" | "register"; cause: unknown };

/**
 * 권한이 허용된 뒤 VAPID 키 조회 → 브라우저 구독 → 서버 등록을 진행한다.
 * 실패 단계마다 안내가 달라질 수 있어 예외 대신 결과로 돌려준다.
 * 세션 만료는 전역 처리에 맡기기 위해 그대로 던진다.
 */
export async function registerWebPush(): Promise<RegisterWebPushResult> {
  assertPushNotificationSupport();

  let serverKey: ApplicationServerKey;
  try {
    serverKey = base64UrlToUint8Array(await getVapidPublicKey());
  } catch (cause) {
    rethrowSessionExpired(cause);
    return { status: "error", step: "key", cause };
  }

  let registration: ServiceWorkerRegistration;
  let subscription: PushSubscription;
  try {
    registration = await waitForServiceWorker();
    subscription = await getReusableSubscription(registration, serverKey);
  } catch (cause) {
    return { status: "error", step: "subscribe", cause };
  }

  try {
    const subscriptionId = await registerWithEndpointRetry(
      registration,
      subscription,
      serverKey,
    );
    savePushSubscriptionId(subscriptionId);

    return { status: "subscribed", subscriptionId };
  } catch (cause) {
    rethrowSessionExpired(cause);
    return { status: "error", step: "register", cause };
  }
}

function assertPushNotificationSupport(): void {
  if (!isPushNotificationSupported()) {
    throw new PushNotificationError(
      "UNSUPPORTED",
      "이 브라우저는 웹 푸시 알림을 지원하지 않습니다.",
    );
  }
}

// iPadOS 13 이상은 데스크톱 Safari와 같은 Macintosh UA를 보내므로 터치 지원으로 구분한다.
function isIosDevice(): boolean {
  const { maxTouchPoints, userAgent } = navigator;

  return (
    /iPhone|iPad|iPod/.test(userAgent) ||
    (userAgent.includes("Macintosh") && maxTouchPoints > 1)
  );
}

// `navigator.standalone`은 iOS Safari에만 있는 비표준 속성이다.
function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function rethrowSessionExpired(error: unknown): void {
  if (error instanceof SessionExpiredError) {
    throw error;
  }
}

function waitForServiceWorker(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Service Worker가 활성화되지 않았습니다.")),
        SERVICE_WORKER_READY_TIMEOUT_MS,
      );
    }),
  ]);
}

// 서버 키가 바뀌었거나 곧 만료되는 구독은 해제하고 새로 만든다.
async function getReusableSubscription(
  registration: ServiceWorkerRegistration,
  serverKey: ApplicationServerKey,
): Promise<PushSubscription> {
  const existing = await registration.pushManager.getSubscription();

  if (
    existing &&
    isSameKey(existing.options.applicationServerKey, serverKey) &&
    !isSubscriptionExpiring(existing)
  ) {
    return existing;
  }

  await existing?.unsubscribe();

  return subscribe(registration, serverKey);
}

function subscribe(
  registration: ServiceWorkerRegistration,
  serverKey: ApplicationServerKey,
): Promise<PushSubscription> {
  return registration.pushManager.subscribe({
    applicationServerKey: serverKey,
    userVisibleOnly: true,
  });
}

// PUSH-409-001: 이 endpoint를 다른 계정이 쓰고 있다. 새 endpoint로 한 번만 다시 등록한다.
async function registerWithEndpointRetry(
  registration: ServiceWorkerRegistration,
  subscription: PushSubscription,
  serverKey: ApplicationServerKey,
): Promise<string> {
  try {
    return await registerPushSubscription(toRegisterRequest(subscription));
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.code !== PUSH_ENDPOINT_IN_USE_ERROR_CODE
    ) {
      throw error;
    }
  }

  await subscription.unsubscribe();
  const renewed = await subscribe(registration, serverKey);

  return registerPushSubscription(toRegisterRequest(renewed));
}

// toJSON()의 expirationTime은 API 스키마에 없으므로 endpoint와 keys만 보낸다.
function toRegisterRequest(
  subscription: PushSubscription,
): RegisterPushSubscriptionRequest {
  const { endpoint, keys } = subscription.toJSON();

  if (!endpoint || !keys?.p256dh || !keys.auth) {
    throw new TypeError("푸시 구독 정보가 올바르지 않습니다.");
  }

  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}

function isSameKey(
  current: ArrayBuffer | null,
  next: ApplicationServerKey,
): boolean {
  if (!current) {
    return false;
  }

  const currentBytes = new Uint8Array(current);

  return (
    currentBytes.length === next.length &&
    currentBytes.every((value, index) => value === next[index])
  );
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
