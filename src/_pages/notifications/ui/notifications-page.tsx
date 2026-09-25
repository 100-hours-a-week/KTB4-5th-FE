"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  NOTIFICATION_LIST_LIMIT,
  notificationQueries,
  parseNotificationListQuery,
  useNotificationSessionScope,
  type RawQueryParams,
} from "@/entities/notification";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";

import { useNotificationListPaginationState } from "../model/use-notification-list-pagination-state";
import { NotificationFilterSection } from "./notification-filter-section";
import { NotificationListContainer } from "./notification-list-container";

type NotificationsPageProps = {
  queryParams: RawQueryParams;
};

export function NotificationsPage({ queryParams }: NotificationsPageProps) {
  const { filter } = useMemo(
    () => parseNotificationListQuery(queryParams),
    [queryParams],
  );
  const refrigeratorId = useCurrentRefrigeratorId();
  const userScope = useNotificationSessionScope();
  const options = useMemo(
    () => ({
      ...notificationQueries.list(
        userScope ?? "",
        refrigeratorId ?? "",
        filter,
      ),
      enabled: Boolean(userScope && refrigeratorId),
    }),
    [filter, refrigeratorId, userScope],
  );
  const {
    data,
    error,
    isPending,
    isError,
    isRefetchError,
    isFetchingNextPage,
    isFetching,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(options);
  const { scrollContainerRef, handleScroll } =
    useNotificationListPaginationState(options.queryKey);
  const notifications =
    data?.pages
      .flatMap((page) => page.notifications)
      .slice(0, NOTIFICATION_LIST_LIMIT) ?? [];

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex-none px-5 pt-2 pb-3">
        <NotificationFilterSection filter={filter} />
      </div>

      <section
        ref={scrollContainerRef}
        onScroll={handleScroll}
        aria-label="알림 목록"
        className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(var(--space-6)+var(--safe-bottom))] [-webkit-overflow-scrolling:touch]"
      >
        <NotificationListContainer
          filter={filter}
          notifications={notifications}
          scrollContainerRef={scrollContainerRef}
          isPending={isPending}
          isInitialError={isError && !data}
          isRefetchError={isRefetchError}
          isFetchingNextPage={isFetchingNextPage}
          isFetching={isFetching}
          isFetchNextPageError={isFetchNextPageError}
          hasNextPage={Boolean(hasNextPage)}
          onFetchNextPage={() => fetchNextPage({ cancelRefetch: false })}
          onRetry={() => void refetch()}
          error={error}
        />
      </section>
    </main>
  );
}
