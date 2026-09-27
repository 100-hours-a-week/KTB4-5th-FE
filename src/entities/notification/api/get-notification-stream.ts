import { requestJson } from "@/shared/api";

export type NotificationStream = { notificationId: string | null };

export async function getNotificationStream({
  refrigeratorId,
  signal,
}: {
  refrigeratorId: string;
  signal?: AbortSignal;
}): Promise<NotificationStream> {
  const { data } = await requestJson<NotificationStream>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/notifications/stream`,
    { signal },
  );

  return data;
}
