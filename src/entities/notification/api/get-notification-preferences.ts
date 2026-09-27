import { requestJson } from "@/shared/api";

import {
  isSupportedNotificationPreference,
  type NotificationPreference,
} from "../model/notification-preference";

type NotificationPreferencesApiResponse = {
  notificationPreferences: { type: string; isEnabled: boolean }[];
};

export type NotificationPreferencesResponse = {
  notificationPreferences: NotificationPreference[];
};

type GetNotificationPreferencesParams = {
  signal?: AbortSignal;
};

export async function getNotificationPreferences({
  signal,
}: GetNotificationPreferencesParams = {}): Promise<NotificationPreferencesResponse> {
  const response = await requestJson<NotificationPreferencesApiResponse>(
    "/notifications/settings",
    { signal },
  );

  return {
    notificationPreferences: response.data.notificationPreferences.filter(
      isSupportedNotificationPreference,
    ),
  };
}
