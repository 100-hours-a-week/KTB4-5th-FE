import { requestJson } from "@/shared/api";

export type UnreadNotificationCountResponse = {
  refrigeratorId: string | number;
  unreadCount: number;
};

type GetUnreadNotificationCountParams = {
  refrigeratorId: string;
  signal?: AbortSignal;
};

export async function getUnreadNotificationCount({
  refrigeratorId,
  signal,
}: GetUnreadNotificationCountParams): Promise<UnreadNotificationCountResponse> {
  const response = await requestJson<UnreadNotificationCountResponse>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/notifications/unread-count`,
    { signal },
  );

  return response.data;
}
