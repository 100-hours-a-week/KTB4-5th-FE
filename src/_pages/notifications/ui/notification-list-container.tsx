"use client";

import type { RefObject } from "react";

import {
  type Notification,
  type NotificationListFilter,
} from "@/entities/notification";
import { ApiError } from "@/shared/api";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

import { useInfiniteScrollTrigger } from "../model/use-infinite-scroll-trigger";
import { NOTIFICATION_EMPTY_STATES } from "../model/notification-empty-states";
import { groupNotificationsByDate } from "../model/notification-groups";
import { NotificationCard } from "./notification-card";

type NotificationListContainerProps = {
  filter: NotificationListFilter;
  notifications: Notification[];
  scrollContainerRef: RefObject<HTMLElement | null>;
  isPending: boolean;
  isInitialError: boolean;
  isRefetchError: boolean;
  isFetchingNextPage: boolean;
  isFetching: boolean;
  isFetchNextPageError: boolean;
  hasNextPage: boolean;
  onFetchNextPage: () => Promise<unknown>;
  onRetry: () => void;
  error: Error | null;
};

/**
 * 오류 상태(첫 조회·재조회·다음 페이지)는 동시에 참이 되지 않으므로
 * 공유 `error`는 항상 지금 보여주는 상태의 오류다.
 */
function getErrorTitle(error: Error | null, fallback: string) {
  if (error instanceof ApiError) {
    return error.problem.title || fallback;
  }

  return "네트워크 연결을 확인해 주세요";
}

type InlineRetryProps = {
  message: string;
  onRetry: () => void;
};

function InlineRetry({ message, onRetry }: InlineRetryProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 py-4">
      <p className="mb-0 text-sm text-app-ink/55">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={asyncViewActionClassName}
      >
        다시 시도
      </button>
    </div>
  );
}

export function NotificationListContainer({
  filter,
  notifications,
  scrollContainerRef,
  isPending,
  isInitialError,
  isRefetchError,
  isFetchingNextPage,
  isFetching,
  isFetchNextPageError,
  hasNextPage,
  onFetchNextPage,
  onRetry,
  error,
}: NotificationListContainerProps) {
  const groups = groupNotificationsByDate(notifications);
  const emptyState = NOTIFICATION_EMPTY_STATES[filter];
  const infiniteScrollTriggerRef = useInfiniteScrollTrigger({
    rootRef: scrollContainerRef,
    enabled: hasNextPage && !isFetching && !isFetchNextPageError,
    onLoadMore: onFetchNextPage,
  });

  if (isPending) {
    return <AsyncViewState status="loading" title="알림을 불러오는 중입니다" />;
  }

  if (isInitialError) {
    return (
      <AsyncViewState
        status="error"
        title={getErrorTitle(error, "알림을 불러오지 못했어요")}
        description="잠시 후 다시 시도해 주세요"
        action={
          <button
            type="button"
            onClick={onRetry}
            className={asyncViewActionClassName}
          >
            다시 시도
          </button>
        }
      />
    );
  }

  if (notifications.length === 0) {
    return (
      <AsyncViewState
        status="empty"
        title={emptyState.title}
        description={emptyState.description}
      />
    );
  }

  return (
    <>
      <p className="mb-3 text-[12px] text-app-ink/55">
        최근 알림부터 최대 99개까지 보관돼요
      </p>

      {isRefetchError ? (
        <InlineRetry
          message={getErrorTitle(error, "최신 알림을 불러오지 못했어요")}
          onRetry={onRetry}
        />
      ) : null}

      {groups.map((group) => (
        <section
          key={group.dateKey}
          aria-labelledby={`notification-date-${group.dateKey}`}
          className="mb-5"
        >
          <h2
            id={`notification-date-${group.dateKey}`}
            className="mb-3 text-[13px] font-normal text-app-ink/55"
          >
            {group.dateLabel}
          </h2>
          <ul className="flex flex-col gap-3">
            {group.notifications.map((notification) => (
              <li key={notification.notificationId}>
                <NotificationCard notification={notification} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div ref={infiniteScrollTriggerRef} aria-hidden="true" className="h-px" />

      {isFetchingNextPage ? (
        <p role="status" className="py-4 text-center text-sm text-app-ink/55">
          알림을 더 불러오는 중입니다
        </p>
      ) : null}

      {isFetchNextPageError ? (
        <InlineRetry
          message={getErrorTitle(error, "다음 알림을 불러오지 못했어요")}
          onRetry={() => void onFetchNextPage()}
        />
      ) : null}
    </>
  );
}
