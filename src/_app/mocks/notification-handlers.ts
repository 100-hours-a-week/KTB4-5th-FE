import { http, HttpResponse } from "msw";

import type {
  Notification,
  NotificationPreference,
} from "@/entities/notification";
import type { ApiResponse } from "@/shared/api";

const HOUR_MS = 60 * 60 * 1000;

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * HOUR_MS).toISOString();
}

let notifications: Notification[] = [
  {
    notificationId: "1051",
    type: "MEMBER",
    title: "새 참여자가 들어왔어요",
    body: "민주님이 참여했어요",
    readAt: null,
    createdAt: hoursAgo(1),
  },
  {
    notificationId: "1050",
    type: "MEMBER",
    title: "참여자가 나갔어요",
    body: "헤니님이 냉장고를 나갔어요",
    readAt: null,
    createdAt: hoursAgo(3),
  },
  {
    notificationId: "1042",
    type: "EXPIRING_SOON",
    title: "오늘 만료되는 재료가 있어요",
    body: "달걀 10개 외 1개 · 오늘까지예요",
    readAt: null,
    createdAt: hoursAgo(6),
  },
  {
    notificationId: "1039",
    type: "EXPIRED",
    title: "만료된 재료가 있어요",
    body: "두부 2개 외 2개 · 2일 지났어요",
    readAt: hoursAgo(20),
    createdAt: hoursAgo(26),
  },
  {
    notificationId: "1031",
    type: "MEMBER",
    title: "참여자가 나갔어요",
    body: "다먹자님이 냉장고에서 나갔어요",
    readAt: hoursAgo(40),
    createdAt: hoursAgo(50),
  },
];

let notificationPreferences: NotificationPreference[] = [
  { type: "EXPIRATION", isEnabled: true },
  { type: "RECIPE", isEnabled: true },
];

const noContent = () => new HttpResponse(null, { status: 204 });

export const notificationHandlers = [
  http.get("*/api/v1/notifications/settings", () =>
    HttpResponse.json<
      ApiResponse<{ notificationPreferences: NotificationPreference[] }>
    >({
      code: "NOTI-200-001",
      message: "알림 설정 조회 성공",
      data: { notificationPreferences },
    }),
  ),
  http.patch("*/api/v1/notifications/settings", async ({ request }) => {
    const body: unknown = await request.json().catch(() => null);
    const changes =
      body && typeof body === "object" && "notificationPreferences" in body
        ? body.notificationPreferences
        : null;
    if (
      !Array.isArray(changes) ||
      changes.length === 0 ||
      changes.some(
        (change) =>
          !change ||
          (change.type !== "EXPIRATION" && change.type !== "RECIPE") ||
          typeof change.isEnabled !== "boolean",
      )
    ) {
      return HttpResponse.json(
        {
          type: "about:blank",
          title: "요청 형식이 올바르지 않습니다.",
          status: 400,
          detail: "요청 형식이 올바르지 않습니다.",
          code: "GLOBAL-400-001",
        },
        {
          status: 400,
          headers: { "Content-Type": "application/problem+json" },
        },
      );
    }

    notificationPreferences = notificationPreferences.map((preference) => ({
      ...preference,
      isEnabled:
        changes.find((change) => change.type === preference.type)?.isEnabled ??
        preference.isEnabled,
    }));
    return HttpResponse.json<
      ApiResponse<{ notificationPreferences: NotificationPreference[] }>
    >({
      code: "NOTI-200-002",
      message: "알림 설정 변경 성공",
      data: { notificationPreferences },
    });
  }),
  http.get(
    "*/api/v1/refrigerators/:refrigeratorId/notifications",
    ({ request }) => {
      const type = new URL(request.url).searchParams.get("type") ?? "ALL";
      const filtered = notifications.filter((item) =>
        type === "READ"
          ? item.readAt !== null
          : type === "UNREAD"
            ? item.readAt === null
            : true,
      );

      return HttpResponse.json({
        code: "NOTI-200-001",
        message: "알림 목록 조회 성공",
        data: {
          expiredIngredientsNum: 3,
          notifications: filtered,
          nextCursor: null,
          hasNext: false,
        },
      });
    },
  ),
  http.get(
    "*/api/v1/refrigerators/:refrigeratorId/notifications/unread-count",
    ({ params }) =>
      HttpResponse.json<
        ApiResponse<{ refrigeratorId: string; unreadCount: number }>
      >({
        code: "NOTI-200-002",
        message: "미읽음 알림 수 조회 성공",
        data: {
          refrigeratorId: String(params.refrigeratorId),
          unreadCount: notifications.filter((item) => item.readAt === null)
            .length,
        },
      }),
  ),
  http.patch(
    "*/api/v1/refrigerators/:refrigeratorId/notifications/read-all",
    () => {
      const now = new Date().toISOString();
      notifications = notifications.map((item) => ({
        ...item,
        readAt: item.readAt ?? now,
      }));
      return noContent();
    },
  ),
  http.patch("*/api/v1/notifications/:notificationId/read", ({ params }) => {
    const now = new Date().toISOString();
    notifications = notifications.map((item) =>
      item.notificationId === params.notificationId
        ? { ...item, readAt: item.readAt ?? now }
        : item,
    );
    return noContent();
  }),
];
