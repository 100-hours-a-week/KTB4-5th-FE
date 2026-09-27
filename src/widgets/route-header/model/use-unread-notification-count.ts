"use client";

import { useQuery } from "@tanstack/react-query";

import {
  notificationQueries,
  useNotificationSessionScope,
} from "@/entities/notification";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";

export function useUnreadNotificationCount(): number | undefined {
  const userScope = useNotificationSessionScope();
  const refrigeratorId = useCurrentRefrigeratorId();
  const { data } = useQuery({
    ...notificationQueries.unreadCount(userScope ?? "", refrigeratorId ?? ""),
    enabled: Boolean(userScope && refrigeratorId),
    refetchInterval: false,
  });

  return userScope &&
    refrigeratorId &&
    data &&
    String(data.refrigeratorId) === refrigeratorId
    ? data.unreadCount
    : undefined;
}
