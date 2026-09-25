import { requestJson } from "@/shared/api";

import type { Notification } from "../model/notification";
import type { NotificationListFilter } from "../model/notification-list-query";

export const NOTIFICATION_LIST_LIMIT = 99;

export type NotificationListPage = {
  expiredIngredientsNum: number;
  notifications: Notification[];
  nextCursor: string | null;
  hasNext: boolean;
};

type GetNotificationListParams = {
  refrigeratorId: string;
  type: NotificationListFilter;
  cursor?: string | null;
  signal?: AbortSignal;
};

export async function getNotificationList({
  refrigeratorId,
  type,
  cursor,
  signal,
}: GetNotificationListParams): Promise<NotificationListPage> {
  const params = new URLSearchParams({ type });

  if (cursor !== null && cursor !== undefined) {
    params.set("cursor", cursor);
  }

  const response = await requestJson<NotificationListPage>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/notifications?${params}`,
    { signal },
  );

  return response.data;
}
