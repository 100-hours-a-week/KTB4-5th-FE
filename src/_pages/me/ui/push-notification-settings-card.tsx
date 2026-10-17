"use client";

import { isExpirationNotificationEnabled } from "@/entities/notification";
import type { MypageOverview } from "@/entities/refrigerator";
import { usePushNotificationSetting } from "@/features/manage-push-notifications";
import { routes } from "@/shared/routes";

import { SettingsCard } from "./settings-card";

export function PushNotificationSettingsCard({
  preferences,
}: {
  preferences: MypageOverview["notificationPreferences"] | undefined;
}) {
  const { status } = usePushNotificationSetting();
  const blocked = status === "blocked" || status === "blocked-ios";
  const trailingText = blocked
    ? "휴대폰 설정 확인 필요"
    : preferences
      ? isExpirationNotificationEnabled(preferences)
        ? "켜짐"
        : "꺼짐"
      : undefined;

  return (
    <SettingsCard
      title="알림 설정"
      trailingText={trailingText}
      href={routes.notificationSettings}
    />
  );
}
