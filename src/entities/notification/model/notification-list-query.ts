export const NOTIFICATION_LIST_FILTERS = ["ALL", "READ", "UNREAD"] as const;
export type NotificationListFilter = (typeof NOTIFICATION_LIST_FILTERS)[number];

export const DEFAULT_NOTIFICATION_LIST_FILTER: NotificationListFilter = "ALL";

// 화면 URL의 filter 값은 알림 목록 조회 API의 `type` 파라미터로 그대로 전달한다.
export type NotificationListQuery = {
  filter: NotificationListFilter;
};

export type RawQueryParams = Record<string, string | string[] | undefined>;

const NOTIFICATION_LIST_QUERY_KEYS = {
  filter: "filter",
} as const;

function readAllowedValue<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | null {
  const single = (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  return allowed.includes(single as T) ? (single as T) : null;
}

export function parseNotificationListQuery(
  queryParams: RawQueryParams,
): NotificationListQuery {
  return {
    filter:
      readAllowedValue(
        queryParams[NOTIFICATION_LIST_QUERY_KEYS.filter],
        NOTIFICATION_LIST_FILTERS,
      ) ?? DEFAULT_NOTIFICATION_LIST_FILTER,
  };
}

export function toNotificationListQueryString(
  query: NotificationListQuery,
): string {
  const queryParams = new URLSearchParams();

  if (query.filter !== DEFAULT_NOTIFICATION_LIST_FILTER) {
    queryParams.set(NOTIFICATION_LIST_QUERY_KEYS.filter, query.filter);
  }

  return queryParams.toString();
}
