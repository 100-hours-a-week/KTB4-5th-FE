import type { NotificationListFilter } from "@/entities/notification";

export const NOTIFICATION_EMPTY_STATES = {
  ALL: {
    title: "아직 받은 알림이 없어요",
    description: "유효기간이 3일 안에 끝나는 재료가 생기면 알려드릴게요",
  },
  READ: {
    title: "읽은 알림이 없어요",
    description: "확인한 알림이 여기에 모여요",
  },
  UNREAD: {
    title: "읽지 않은 알림이 없어요",
    description: "새로 도착한 알림이 여기에 표시돼요",
  },
} satisfies Record<
  NotificationListFilter,
  { title: string; description: string }
>;
