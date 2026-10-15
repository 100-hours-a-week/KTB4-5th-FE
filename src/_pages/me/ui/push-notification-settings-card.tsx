"use client";

import { useQuery } from "@tanstack/react-query";

import {
  isExpirationNotificationEnabled,
  notificationQueries,
  useNotificationSessionScope,
} from "@/entities/notification";
import { usePushNotificationSetting } from "@/features/manage-push-notifications";
import { routes } from "@/shared/routes";

import { SettingsCard } from "./settings-card";

export function PushNotificationSettingsCard() {
  const { status } = usePushNotificationSetting();
  const sessionScope = useNotificationSessionScope();
  const { data } = useQuery({
    ...notificationQueries.preferences(sessionScope ?? ""),
    enabled: sessionScope !== undefined,
  });
  const blocked = status === "blocked" || status === "blocked-ios";
  const trailingText = blocked
    ? "휴대폰 설정 확인 필요"
    : data
      ? isExpirationNotificationEnabled(data.notificationPreferences)
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
