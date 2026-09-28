import { deletePushSubscription } from "../api/delete-push-subscription";
import {
  clearPushSubscriptionId,
  readPushSubscriptionId,
} from "./push-subscription-id";

export async function disablePushSubscription(): Promise<void> {
  const subscriptionId = readPushSubscriptionId();

  if (subscriptionId) {
    await deletePushSubscription(subscriptionId);
  }

  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    if (subscription && !(await subscription.unsubscribe())) {
      throw new Error("브라우저 푸시 구독을 해제하지 못했습니다.");
    }
  }

  clearPushSubscriptionId();
}

export async function releasePushSubscription(): Promise<void> {
  try {
    await disablePushSubscription();
  } catch {
    await clearLocalPushSubscription();
  }
}

export async function clearLocalPushSubscription(): Promise<void> {
  clearPushSubscriptionId();

  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
  } catch {
    // 브라우저 구독 해제에 실패해도 로그아웃은 계속한다.
  }
}
