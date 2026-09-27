export const NOTIFICATION_TYPES = [
  "MEMBER",
  "EXPIRED",
  "EXPIRING_SOON",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type Notification = {
  notificationId: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};
