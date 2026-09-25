import "client-only";

import {
  getNotificationPreferences,
  isExpirationNotificationEnabled,
} from "@/entities/notification";

import {
  getPushNotificationSupport,
  registerWebPush,
} from "./push-notification-subscription";

/**
 * 로그아웃 때 구독을 해제하므로 로그인 직후 다시 구독한다.
 * 권한 요청은 사용자 클릭에서만 할 수 있어 이미 허용된 기기만 대상으로 하고,
 * 로그인 흐름을 막지 않도록 실패는 조용히 넘긴다.
 */
export async function resubscribePushNotificationsIfEnabled(): Promise<void> {
  try {
    if (
      getPushNotificationSupport() !== "supported" ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    const { notificationPreferences } = await getNotificationPreferences();

    if (isExpirationNotificationEnabled(notificationPreferences)) {
      await registerWebPush();
    }
  } catch {
    // 다음 버전 MY 알림 카드에서 설정할 수 있다.
  }
}
