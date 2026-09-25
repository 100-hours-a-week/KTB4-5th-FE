import {
  hashKey,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";

import type { NotificationListPage } from "./get-notification-list";
import { notificationQueries } from "./notification.queries";

const pendingListRefreshes = new WeakMap<
  QueryClient,
  Map<string, Promise<void>>
>();

export async function refreshNotificationLists(
  queryClient: QueryClient,
  userScope: string,
  refrigeratorId: string,
): Promise<void> {
  const listsKey = notificationQueries.lists(userScope, refrigeratorId);
  const refreshKey = hashKey(listsKey);
  let pending = pendingListRefreshes.get(queryClient);
  if (!pending) {
    pending = new Map();
    pendingListRefreshes.set(queryClient, pending);
  }
  const currentRefresh = pending.get(refreshKey);
  if (currentRefresh) return currentRefresh;

  const refresh = (async () => {
    await queryClient.cancelQueries({ queryKey: listsKey });
    queryClient.setQueriesData<
      InfiniteData<NotificationListPage, string | null>
    >({ queryKey: listsKey }, (current) =>
      current
        ? {
            pages: current.pages.slice(0, 1),
            pageParams: current.pageParams.slice(0, 1),
          }
        : current,
    );
    await queryClient.invalidateQueries(
      { queryKey: listsKey, refetchType: "active" },
      { throwOnError: true },
    );
  })();
  pending.set(refreshKey, refresh);
  try {
    await refresh;
  } finally {
    pending.delete(refreshKey);
  }
}

export async function refreshNotificationQueries(
  queryClient: QueryClient,
  userScope: string,
  refrigeratorId: string,
): Promise<void> {
  await Promise.all([
    refreshNotificationLists(queryClient, userScope, refrigeratorId),
    queryClient.invalidateQueries(
      {
        queryKey: notificationQueries.unreadCount(userScope, refrigeratorId)
          .queryKey,
      },
      { throwOnError: true },
    ),
  ]);
}
