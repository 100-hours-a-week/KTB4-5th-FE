import type { Notification } from "@/entities/notification";

export type NotificationGroup = {
  dateKey: string;
  dateLabel: string;
  notifications: Notification[];
};

const dateKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateLabelFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function groupNotificationsByDate(
  notifications: Notification[],
): NotificationGroup[] {
  const groups: NotificationGroup[] = [];

  for (const notification of notifications) {
    const createdAt = new Date(notification.createdAt);
    const dateKey = dateKeyFormat.format(createdAt);
    const lastGroup = groups.at(-1);

    if (lastGroup?.dateKey === dateKey) {
      lastGroup.notifications.push(notification);
      continue;
    }

    groups.push({
      dateKey,
      dateLabel: dateLabelFormat.format(createdAt),
      notifications: [notification],
    });
  }

  return groups;
}
