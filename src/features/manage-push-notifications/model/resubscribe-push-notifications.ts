import "client-only";

import {
  getNotificationPreferences,
  isExpirationNotificationEnabled,
} from "@/entities/notification";
import { isPushOptedOut } from "@/entities/push-subscription";

import {
  getPushNotificationSupport,
  registerWebPush,
} from "./push-notification-subscription";
import { PushRegistrationFailure } from "./push-registration-failure";

/**
 * 로그아웃 때 구독을 해제하므로 로그인 직후 다시 구독한다.
 * 권한 요청은 사용자 클릭에서만 할 수 있어 이미 허용된 기기만 대상으로 하고,
 * 사용자가 이 기기에서 직접 끈 경우는 다시 켜지 않는다.
 * 호출 측의 백그라운드 mutation이 실패를 보고하며 로그인 흐름은 계속한다.
 */
export async function resubscribePushNotificationsIfEnabled(): Promise<void> {
  if (
    getPushNotificationSupport() !== "supported" ||
    Notification.permission !== "granted" ||
    isPushOptedOut()
  ) {
    return;
  }

  const { notificationPreferences } = await getNotificationPreferences();

  if (isExpirationNotificationEnabled(notificationPreferences)) {
    const result = await registerWebPush();
    if (result.status === "error") {
      throw new PushRegistrationFailure(result);
    }
  }
}
