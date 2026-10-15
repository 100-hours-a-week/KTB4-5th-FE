import {
  InfiniteQueryObserver,
  QueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import type { NotificationListPage } from "./get-notification-list";
import { notificationQueries } from "./notification.queries";
import {
  refreshNotificationLists,
  refreshNotificationQueries,
} from "./refresh-notification-queries";

function page(size: number, nextCursor: string | null): NotificationListPage {
  return {
    expiredIngredientsNum: 0,
    notifications: Array.from({ length: size }, (_, index) => ({
      notificationId: String(index),
      type: "EXPIRED" as const,
      title: "만료된 재료가 있어요",
      body: "시금치 1개 · 2일 지났어요",
      readAt: null,
      createdAt: "2026-09-25T08:00:00+09:00",
    })),
    nextCursor,
    hasNext: nextCursor !== null,
  };
}

describe("알림 목록 99개 표시 한도", () => {
  const getNextPageParam = notificationQueries.list(
    "user-1",
    "5",
    "ALL",
  ).getNextPageParam;

  it("98개까지는 다음 페이지를 조회하고 99개가 되면 서버에 더 있어도 멈춘다", () => {
    const firstNinePages = Array.from({ length: 9 }, () => page(10, "next"));
    const at98 = [...firstNinePages, page(8, "next")];
    const at99 = [...firstNinePages, page(9, "next")];

    expect(getNextPageParam(at98.at(-1)!, at98, "current", [])).toBe("next");
    expect(getNextPageParam(at99.at(-1)!, at99, "current", [])).toBeUndefined();
  });

  it("99개 미만이어도 서버가 마지막 페이지를 반환하면 멈춘다", () => {
    const pages = [page(10, null)];

    expect(getNextPageParam(pages[0], pages, null, [])).toBeUndefined();
  });

  it("사용자·냉장고·필터별 캐시를 분리한다", () => {
    expect(notificationQueries.list("user-1", "5", "ALL").queryKey).toEqual([
      "notifications",
      "user-1",
      "5",
      "list",
      "ALL",
    ]);
    expect(
      notificationQueries.list("user-1", "5", "UNREAD").queryKey,
    ).not.toEqual(notificationQueries.list("user-1", "5", "ALL").queryKey);
    expect(notificationQueries.list("user-2", "5", "ALL").queryKey).not.toEqual(
      notificationQueries.list("user-1", "5", "ALL").queryKey,
    );
    expect(notificationQueries.list("user-1", "6", "ALL").queryKey).not.toEqual(
      notificationQueries.list("user-1", "5", "ALL").queryKey,
    );
  });

  it("미읽음 수는 타이머로 재조회하지 않는다", () => {
    expect(
      notificationQueries.unreadCount("user-1", "5").refetchInterval,
    ).toBeUndefined();
  });

  it("새 알림이 오면 첫 페이지를 갱신하고 오래된 후속 페이지를 섞지 않는다", async () => {
    const queryClient = new QueryClient();
    const options = notificationQueries.list("user-1", "5", "ALL");
    const oldPages = [
      ...Array.from({ length: 9 }, () => page(10, "next")),
      page(9, null),
    ];
    queryClient.setQueryData(options.queryKey, {
      pages: oldPages,
      pageParams: [null, ...Array.from({ length: 9 }, () => "next")],
    });
    const newFirstPage = page(10, "next");
    newFirstPage.notifications[0].notificationId = "100";
    const queryFn = vi.fn(async () => newFirstPage);
    const observer = new InfiniteQueryObserver(queryClient, {
      ...options,
      queryFn,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => {});

    try {
      await refreshNotificationLists(queryClient, "user-1", "5");

      const data = queryClient.getQueryData<
        InfiniteData<NotificationListPage, string | null>
      >(options.queryKey);
      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(data?.pages).toEqual([newFirstPage]);
      expect(data?.pageParams).toEqual([null]);
    } finally {
      unsubscribe();
      queryClient.clear();
    }
  });

  it("알림 화면이 열려 있지 않아도 목록 첫 페이지와 미읽음 수를 다시 조회한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const fetchMock = vi.fn(async (url: string) =>
      Response.json({
        code: "NOTI-200-001",
        message: "조회 성공",
        data: url.includes("unread-count")
          ? { refrigeratorId: "5", unreadCount: 1 }
          : page(1, null),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      await refreshNotificationQueries(queryClient, "user-1", "5");

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(
        expect.arrayContaining([
          "/api/v1/refrigerators/5/notifications?type=ALL",
          "/api/v1/refrigerators/5/notifications/unread-count",
        ]),
      );
    } finally {
      queryClient.clear();
      vi.unstubAllGlobals();
    }
  });
});
