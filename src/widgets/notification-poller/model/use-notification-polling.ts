"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import {
  notificationQueries,
  refreshNotificationLists,
  refreshNotificationQueries,
} from "@/entities/notification";

type LatestId = string | null | undefined;

export function useNotificationPolling(
  userScope: string,
  refrigeratorId: string,
): void {
  const queryClient = useQueryClient();
  const previousId = useRef<LatestId>(undefined);
  const previousUnreadCount = useRef<number | undefined>(undefined);
  const stream = useQuery(
    notificationQueries.stream(userScope, refrigeratorId),
  );
  const unread = useQuery(
    notificationQueries.unreadCount(userScope, refrigeratorId),
  );
  const refetchStream = stream.refetch;

  useEffect(() => {
    if (!stream.data || stream.dataUpdatedAt === 0) return;

    const latestId = stream.data.notificationId;
    const previous = previousId.current;
    previousId.current = latestId;

    if (previous === undefined || previous === latestId) return;

    void refreshNotificationQueries(
      queryClient,
      userScope,
      refrigeratorId,
    ).catch(() => {
      // 백그라운드 조회 오류는 Query 상태에 남긴다.
    });
  }, [
    queryClient,
    userScope,
    refrigeratorId,
    stream.data,
    stream.dataUpdatedAt,
  ]);

  useEffect(() => {
    const count = unread.data?.unreadCount;
    if (count === undefined) return;

    const previous = previousUnreadCount.current;
    previousUnreadCount.current = count;
    if (previous === undefined || previous === count) return;

    void refreshNotificationLists(queryClient, userScope, refrigeratorId).catch(
      () => {
        // 목록 실패 시 이전 첫 페이지를 유지한다.
      },
    );
  }, [queryClient, userScope, refrigeratorId, unread.data?.unreadCount]);

  useEffect(() => {
    function onVisibilityChange() {
      const contextKey = notificationQueries.byRefrigerator(
        userScope,
        refrigeratorId,
      );

      if (document.visibilityState === "hidden") {
        void queryClient.cancelQueries({ queryKey: contextKey });
        return;
      }

      void refetchStream();
      void refreshNotificationQueries(
        queryClient,
        userScope,
        refrigeratorId,
      ).catch(() => {
        // 재조회 실패 시 이전 첫 페이지를 유지한다.
      });
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [queryClient, userScope, refrigeratorId, refetchStream]);
}
