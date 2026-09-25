import type { NotificationListFilter } from "../model/notification-list-query";

export const NOTIFICATION_LIST_FILTER_LABELS = {
  ALL: "전체",
  READ: "읽음",
  UNREAD: "읽지 않음",
} satisfies Record<NotificationListFilter, string>;
