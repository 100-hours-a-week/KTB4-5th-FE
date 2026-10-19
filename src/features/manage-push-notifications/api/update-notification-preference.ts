import { requestJson } from "@/shared/api";
import type {
  NotificationPreferencesResponse,
  NotificationPreferenceType,
} from "@/entities/notification";

export async function updateNotificationPreference(
  type: NotificationPreferenceType,
  isEnabled: boolean,
): Promise<NotificationPreferencesResponse> {
  const response = await requestJson<NotificationPreferencesResponse>(
    "/notifications/settings",
    {
      method: "PATCH",
      json: { notificationPreferences: [{ type, isEnabled }] },
    },
  );
  return response.data;
}
