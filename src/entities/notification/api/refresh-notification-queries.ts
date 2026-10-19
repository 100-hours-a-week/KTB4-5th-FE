import {
  hashKey,
  type InfiniteData,
  type QueryClient,
  type QueryKey,
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
    const allList = notificationQueries.list(userScope, refrigeratorId, "ALL");
    const cache = queryClient.getQueryCache();
    const queryKey: QueryKey = allList.queryKey;
    const allListQuery = cache.build(queryClient, {
      queryKey,
    });
    const isAllListActive = Boolean(allListQuery.getObserversCount());
    // 냉장고 전환·로그아웃으로 제거한 목록을 await 이후 다시 만들지 않는다.
    const wasRemoved = () =>
      cache.find({ queryKey: allList.queryKey, exact: true }) !== allListQuery;
    await queryClient.cancelQueries({ queryKey: listsKey });
    if (wasRemoved()) return;
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
    if (!isAllListActive && !wasRemoved()) {
      await queryClient.fetchInfiniteQuery({ ...allList, staleTime: 0 });
    }
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
    queryClient.fetchQuery({
      ...notificationQueries.unreadCount(userScope, refrigeratorId),
      staleTime: 0,
    }),
  ]);
}
