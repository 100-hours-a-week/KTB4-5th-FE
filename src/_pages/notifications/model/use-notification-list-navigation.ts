"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  notificationQueries,
  toNotificationListQueryString,
  type NotificationListFilter,
  useNotificationSessionScope,
} from "@/entities/notification";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";

export function useNotificationListNavigation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userScope = useNotificationSessionScope();
  const refrigeratorId = useCurrentRefrigeratorId();

  return useCallback(
    (filter: NotificationListFilter) => {
      if (userScope && refrigeratorId) {
        queryClient.removeQueries({
          queryKey: notificationQueries.list(userScope, refrigeratorId, filter)
            .queryKey,
          exact: true,
        });
      }

      const queryString = toNotificationListQueryString({ filter });
      const href = queryString
        ? `${routes.notifications}?${queryString}`
        : routes.notifications;

      markAppNavigationIntent("replace", href);
      router.replace(href, { scroll: false });
    },
    [router, queryClient, userScope, refrigeratorId],
  );
}
