"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { imageAnalysisQueries } from "@/entities/image";
import { recommendationQueries } from "@/entities/recommendation";
import { useRecoverRefrigeratorAccess } from "@/features/recover-refrigerator-access";

import {
  getNotificationEventsUrl,
  notificationQueries,
  refreshNotificationQueries,
} from "@/entities/notification";
import {
  ApiError,
  isIntentionalLogout,
  SessionExpiredError,
} from "@/shared/api";

const RETRY_BASE_MS = 1000;
const RETRY_MAX_MS = 30_000;

export function useNotificationSse(userScope: string, refrigeratorId: string) {
  const queryClient = useQueryClient();
  const recoverRefrigeratorAccess = useRecoverRefrigeratorAccess(
    userScope,
    refrigeratorId,
  );

  useEffect(() => {
    if (typeof EventSource === "undefined") {
      return;
    }

    let active = true;
    let source: EventSource;
    let retryDelay = RETRY_BASE_MS;
    let retryTimer: number | undefined;

    function refreshAnalyses() {
      void queryClient.invalidateQueries({
        queryKey: imageAnalysisQueries.list(userScope).queryKey,
      });
    }

    function refreshRecommendations() {
      void queryClient.invalidateQueries({
        queryKey: recommendationQueries.list(refrigeratorId).queryKey,
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

    function scheduleReconnect() {
      if (!active || document.visibilityState === "hidden") return;
      window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(
        connect,
        retryDelay * (0.5 + Math.random()),
      );
      retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
    }

    function connect() {
      window.clearTimeout(retryTimer);
      source?.close();
      const stream = new EventSource(getNotificationEventsUrl(refrigeratorId), {
        withCredentials: true,
      });
      source = stream;

      stream.addEventListener("kicked", (event) => {
        if (!active || stream !== source || isIntentionalLogout()) return;
        try {
          const payload: unknown = JSON.parse(event.data);
          if (
            typeof payload !== "object" ||
            payload === null ||
            Array.isArray(payload)
          )
            return;
        } catch {
          return;
        }
        active = false;
        window.clearTimeout(retryTimer);
        stream.close();
        recoverRefrigeratorAccess();
      });

      stream.addEventListener("connected", () => {
        if (!active || stream !== source) return;
        retryDelay = RETRY_BASE_MS;
        void queryClient.invalidateQueries({
          queryKey: imageAnalysisQueries.all(),
        });
        refreshRecommendations();
        refresh();
      });
      stream.addEventListener("recommendation.finished", (event) => {
        if (!active || stream !== source) return;
        try {
          if (JSON.parse(event.data)?.refrigeratorId === refrigeratorId) {
            refreshRecommendations();
          }
        } catch {
          return;
        }
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

        if (stream.readyState !== EventSource.CLOSED) return;

        function retry() {
          if (stream === source && !isIntentionalLogout()) scheduleReconnect();
        }

        // EventSource는 HTTP 오류 상태를 노출하지 않으므로 REST 조회로 기존 인증 흐름을 실행한다.
        void queryClient
          .fetchQuery({
            ...notificationQueries.unreadCount(userScope, refrigeratorId),
            staleTime: 0,
          })
          .then(retry, (error: unknown) => {
            // QueryCache가 세션 만료를 처리한다.
            if (error instanceof SessionExpiredError) return;
            if (error instanceof ApiError && error.status < 500) return;
            retry();
          });
      };
    }

    function onVisibilityChange() {
      if (!active) return;
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
      refreshRecommendations();
      refresh();
    }

    function onOnline() {
      if (!active) return;
      if (source.readyState === EventSource.CLOSED && !isIntentionalLogout()) {
        connect();
      }
    }

    connect();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);
    return () => {
      active = false;
      window.clearTimeout(retryTimer);
      source.close();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
    };
  }, [queryClient, userScope, refrigeratorId, recoverRefrigeratorAccess]);
}
