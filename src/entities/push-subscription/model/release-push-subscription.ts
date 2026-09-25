import { deletePushSubscription } from "../api/delete-push-subscription";
import {
  clearPushSubscriptionId,
  readPushSubscriptionId,
} from "./push-subscription-id";

export async function releasePushSubscription(): Promise<void> {
  const subscriptionId = readPushSubscriptionId();

  if (subscriptionId) {
    try {
      await deletePushSubscription(subscriptionId);
    } catch {
      // 서버에 남은 구독은 브라우저 구독이 사라져 발송이 실패하면 정리된다.
    }
  }

  await clearLocalPushSubscription();
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
