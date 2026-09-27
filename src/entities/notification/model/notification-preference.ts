export const NOTIFICATION_PREFERENCE_TYPES = ["EXPIRATION"] as const;
export type NotificationPreferenceType =
  (typeof NOTIFICATION_PREFERENCE_TYPES)[number];

export type NotificationPreference = {
  type: NotificationPreferenceType;
  isEnabled: boolean;
};

export function isSupportedNotificationPreference(preference: {
  type: string;
  isEnabled: boolean;
}): preference is NotificationPreference {
  return (NOTIFICATION_PREFERENCE_TYPES as readonly string[]).includes(
    preference.type,
  );
}

// 한 번도 바꾸지 않은 유저는 설정이 비어 오므로 기본값인 켜짐으로 본다.
export function isExpirationNotificationEnabled(
  preferences: NotificationPreference[],
): boolean {
  return (
    preferences.find((preference) => preference.type === "EXPIRATION")
      ?.isEnabled ?? true
  );
}
