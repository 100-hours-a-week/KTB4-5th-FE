"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { notificationQueries } from "@/entities/notification";
import {
  refrigeratorQueries,
  setCurrentRefrigeratorId,
} from "@/entities/refrigerator";
import { ApiError, isIntentionalLogout } from "@/shared/api";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";

export function useRecoverRefrigeratorAccess(
  userScope: string,
  refrigeratorId: string,
) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const recovering = useRef(false);

  const recover = useCallback(() => {
    if (recovering.current || isIntentionalLogout()) return;
    recovering.current = true;

    // 캐시된 current로 추방 전 냉장고를 다시 선택하지 않도록 비운다.
    queryClient.removeQueries({
      queryKey: refrigeratorQueries.current().queryKey,
      exact: true,
    });
    setCurrentRefrigeratorId(null);
    // removeQueries는 진행 중인 조회도 취소한다.
    queryClient.removeQueries({
      queryKey: [...refrigeratorQueries.all(), refrigeratorId],
    });
    queryClient.removeQueries({
      queryKey: notificationQueries.byRefrigerator(userScope, refrigeratorId),
    });
    markAppNavigationIntent("replace", routes.home);
    router.replace(routes.home);
  }, [queryClient, refrigeratorId, router, userScope]);

  useEffect(() => {
    function isAccessLost(error: unknown) {
      return (
        error instanceof ApiError &&
        error.status === 403 &&
        error.code === "REFRIGERATOR-403-001"
      );
    }

    const unsubscribeQueries = queryClient
      .getQueryCache()
      .subscribe((event) => {
        if (event.type !== "updated" || event.action.type !== "error") return;
        const key = event.query.queryKey;
        const isCurrentRefrigerator =
          (key[0] === refrigeratorQueries.all()[0] &&
            key[1] === refrigeratorId) ||
          (key[0] === notificationQueries.all()[0] &&
            key[1] === userScope &&
            key[2] === refrigeratorId);
        if (isCurrentRefrigerator && isAccessLost(event.action.error))
          recover();
      });

    // 이전 냉장고에서 시작한 변경의 늦은 오류로 새 냉장고를 초기화하지 않는다.
    const pendingMutations = new Set<object>();
    const unsubscribeMutations = queryClient
      .getMutationCache()
      .subscribe((event) => {
        if (event.type !== "updated") return;
        if (event.action.type === "pending") {
          pendingMutations.add(event.mutation);
        } else if (event.action.type === "error") {
          if (
            pendingMutations.delete(event.mutation) &&
            isAccessLost(event.action.error)
          ) {
            recover();
          }
        } else if (event.action.type === "success") {
          pendingMutations.delete(event.mutation);
        }
      });

    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [queryClient, refrigeratorId, recover, userScope]);

  return recover;
}
