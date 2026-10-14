"use client";

import {
  PushInstallGuideSheet,
  PushPermissionGuideSheet,
  usePushNotificationSetting,
  type PushNotificationSettingStatus,
} from "@/features/manage-push-notifications";

import { SettingsCard } from "./settings-card";

const statusLabels: Record<PushNotificationSettingStatus, string> = {
  on: "켜짐",
  off: "꺼짐",
  blocked: "휴대폰 설정 확인 필요",
  "blocked-ios": "휴대폰 설정 확인 필요",
  "needs-install": "홈 화면 추가 필요",
  unsupported: "지원 안 함",
};

export function PushNotificationSettingsCard() {
  const {
    closeGuide,
    closePermissionGuide,
    handleClick,
    isGuideOpen,
    isPending,
    isPermissionGuideOpen,
    status,
  } = usePushNotificationSetting();

  return (
    <>
      <SettingsCard
        title="알림 설정"
        trailingText={status ? statusLabels[status] : undefined}
        disabled={status === null || isPending}
        onClick={handleClick}
      />

      <PushInstallGuideSheet open={isGuideOpen} onDismiss={closeGuide} />
      <PushPermissionGuideSheet
        open={isPermissionGuideOpen}
        onDismiss={closePermissionGuide}
      />
    </>
  );
}
