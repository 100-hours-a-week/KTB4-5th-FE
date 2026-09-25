import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { ApiError, SessionExpiredError } from "@/shared/api";

import type { NotificationListFilter } from "../model/notification-list-query";
import {
  getNotificationList,
  NOTIFICATION_LIST_LIMIT,
} from "./get-notification-list";
import { getNotificationStream } from "./get-notification-stream";
import { getUnreadNotificationCount } from "./get-unread-notification-count";

export const NOTIFICATION_POLLING_INTERVAL_MS = 30_000;

function retryNotificationList(failureCount: number, error: Error): boolean {
  return (
    !(error instanceof SessionExpiredError) &&
    !(error instanceof ApiError && error.status < 500) &&
    failureCount < 2
  );
}

export const notificationQueries = {
  all: () => ["notifications"] as const,
  byRefrigerator: (userScope: string, refrigeratorId: string) =>
    [...notificationQueries.all(), userScope, refrigeratorId] as const,
  lists: (userScope: string, refrigeratorId: string) =>
    [
      ...notificationQueries.byRefrigerator(userScope, refrigeratorId),
      "list",
    ] as const,
  list: (
    userScope: string,
    refrigeratorId: string,
    type: NotificationListFilter,
  ) =>
    infiniteQueryOptions({
      queryKey: [
        ...notificationQueries.lists(userScope, refrigeratorId),
        type,
      ] as const,
      queryFn: ({ pageParam, signal }) =>
        getNotificationList({
          refrigeratorId,
          type,
          cursor: pageParam,
          signal,
        }),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage, pages) => {
        const loadedCount = pages.reduce(
          (count, page) => count + page.notifications.length,
          0,
        );

        if (loadedCount >= NOTIFICATION_LIST_LIMIT || !lastPage.hasNext) {
          return undefined;
        }
        return lastPage.nextCursor ?? undefined;
      },
      retry: retryNotificationList,
      refetchOnWindowFocus: false,
    }),
  stream: (userScope: string, refrigeratorId: string) =>
    queryOptions({
      queryKey: [
        ...notificationQueries.byRefrigerator(userScope, refrigeratorId),
        "stream",
      ] as const,
      queryFn: ({ signal }) =>
        getNotificationStream({ refrigeratorId, signal }),
      refetchInterval: (query) =>
        query.state.status === "error"
          ? false
          : NOTIFICATION_POLLING_INTERVAL_MS,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      retry: retryNotificationList,
    }),
  unreadCount: (userScope: string, refrigeratorId: string) =>
    queryOptions({
      queryKey: [
        ...notificationQueries.byRefrigerator(userScope, refrigeratorId),
        "unread-count",
      ] as const,
      queryFn: ({ signal }) =>
        getUnreadNotificationCount({ refrigeratorId, signal }),
      refetchInterval: (query) =>
        query.state.status === "error"
          ? false
          : NOTIFICATION_POLLING_INTERVAL_MS,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      staleTime: NOTIFICATION_POLLING_INTERVAL_MS,
      retry: retryNotificationList,
    }),
};
