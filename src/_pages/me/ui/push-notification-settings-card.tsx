"use client";

import {
  PushInstallGuideSheet,
  PushPermissionGuideSheet,
  pushNotificationStatusLabels,
  usePushNotificationSetting,
} from "@/features/manage-push-notifications";

import { SettingsCard } from "./settings-card";

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
        title="PUSH 알림"
        description={
          status ? pushNotificationStatusLabels[status] : "매일 오전 8시"
        }
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
