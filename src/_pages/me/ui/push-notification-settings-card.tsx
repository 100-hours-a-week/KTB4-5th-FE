"use client";

import {
  PushInstallGuideSheet,
  pushNotificationStatusLabels,
  usePushNotificationSetting,
} from "@/features/manage-push-notifications";

import { SettingsCard } from "./settings-card";

export function PushNotificationSettingsCard() {
  const { closeGuide, handleClick, isGuideOpen, isPending, status } =
    usePushNotificationSetting();

  return (
    <>
      <SettingsCard
        title="PUSH 알림"
        description={
          status
            ? `매일 오전 8시 · ${pushNotificationStatusLabels[status]}`
            : "매일 오전 8시"
        }
        disabled={status === null || status === "on" || isPending}
        onClick={handleClick}
      />

      <PushInstallGuideSheet open={isGuideOpen} onDismiss={closeGuide} />
    </>
  );
}
