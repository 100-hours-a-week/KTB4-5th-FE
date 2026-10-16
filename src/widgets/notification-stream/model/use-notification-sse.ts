"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { imageAnalysisQueries } from "@/entities/image";

import {
  getNotificationEventsUrl,
  notificationQueries,
  refreshNotificationQueries,
} from "@/entities/notification";
import { isIntentionalLogout } from "@/shared/api";

export function useNotificationSse(userScope: string, refrigeratorId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof EventSource === "undefined") {
      return;
    }

    let active = true;
    let source: EventSource;
    let checkedError = false;
    let retriedClosedStream = false;

    function refreshAnalyses() {
      void queryClient.invalidateQueries({
        queryKey: imageAnalysisQueries.list(userScope).queryKey,
      });
    }

    function refresh() {
      void refreshNotificationQueries(
        queryClient,
        userScope,
        refrigeratorId,
      ).catch(() => {
        // 백그라운드 조회 오류는 Query 상태에 남긴다.
      });
    }

    function connect() {
      source?.close();
      const stream = new EventSource(getNotificationEventsUrl(refrigeratorId), {
        withCredentials: true,
      });
      source = stream;

      stream.addEventListener("connected", () => {
        if (!active || stream !== source) return;
        checkedError = false;
        retriedClosedStream = false;
        void queryClient.invalidateQueries({
          queryKey: imageAnalysisQueries.all(),
        });
        refresh();
      });
      stream.addEventListener("notifications-changed", (event) => {
        if (!active || stream !== source) return;
        try {
          if (JSON.parse(event.data)?.refrigeratorId === refrigeratorId) {
            refresh();
          }
        } catch {
          // 잘못된 신호는 버리고 다음 신호를 기다린다.
        }
      });
      function onAnalysisChanged(event: MessageEvent<string>) {
        if (!active || stream !== source) return;
        try {
          const payload: unknown = JSON.parse(event.data);
          if (
            typeof payload !== "object" ||
            payload === null ||
            !("analysisId" in payload) ||
            typeof payload.analysisId !== "string" ||
            payload.analysisId.length === 0
          )
            return;
          refreshAnalyses();
          void queryClient.invalidateQueries({
            queryKey: imageAnalysisQueries.detail(payload.analysisId).queryKey,
          });
        } catch {
          // 잘못된 이벤트는 버리고 다음 신호나 재접속 조회로 복구한다.
        }
      }
      stream.addEventListener(
        "image-analysis.image-finished",
        onAnalysisChanged,
      );
      stream.addEventListener("image-analysis.finished", onAnalysisChanged);

      stream.onerror = () => {
        if (!active || stream !== source) return;
        if (isIntentionalLogout()) {
          stream.close();
          return;
        }

        if (checkedError) return;
        checkedError = true;

        // EventSource는 HTTP 오류 상태를 노출하지 않으므로 REST 조회로 기존 인증 흐름을 실행한다.
        void queryClient
          .fetchQuery({
            ...notificationQueries.unreadCount(userScope, refrigeratorId),
            staleTime: 0,
          })
          .then(() => {
            if (
              active &&
              stream === source &&
              stream.readyState === EventSource.CLOSED &&
              !retriedClosedStream
            ) {
              retriedClosedStream = true;
              connect();
            }
          })
          .catch(() => {
            // QueryCache가 세션 만료를 처리한다.
          });
      };
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        void queryClient.cancelQueries({
          queryKey: notificationQueries.byRefrigerator(
            userScope,
            refrigeratorId,
          ),
        });
        return;
      }
      if (source.readyState === EventSource.CLOSED && !isIntentionalLogout()) {
        connect();
      }
      void queryClient.invalidateQueries({
        queryKey: imageAnalysisQueries.all(),
      });
      refresh();
    }

    connect();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      active = false;
      source.close();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [queryClient, userScope, refrigeratorId]);
}
