"use client";

import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { expireSession } from "@/_app/providers/session-expiry";
import { refreshSession, type SessionRefreshResult } from "@/shared/api";
import stackedLogo from "@/shared/assets/logo/logo-stacked.webp";
import { useRetryControl } from "@/shared/lib/use-retry-control";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

type SessionGateProps = {
  needsRenewal: boolean;
  children: ReactNode;
};

export function SessionGate({ needsRenewal, children }: SessionGateProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(needsRenewal ? "pending" : "ready");
  const { retry, retryingError, failureCount, cooldownSeconds } =
    useRetryControl();
  const completeRefresh = useCallback(
    (result: SessionRefreshResult) => {
      if (result === "rejected") {
        expireSession(queryClient);
      } else {
        setStatus(result === "renewed" ? "ready" : "error");
      }
      return { isSuccess: result !== "failed" };
    },
    [queryClient],
  );

  useEffect(() => {
    if (status !== "pending") {
      return;
    }

    let isCancelled = false;

    void refreshSession().then((result) => {
      if (isCancelled) {
        return;
      }
      completeRefresh(result);
    });

    return () => {
      isCancelled = true;
    };
  }, [status, completeRefresh]);

  if (status === "error") {
    return (
      <main className="min-w-0 flex-1">
        <AsyncViewState
          status="error"
          title="로그인 상태를 확인하지 못했어요"
          description={
            failureCount >= 3 ? "잠시 후 다시 시도해 주세요" : undefined
          }
          action={
            <button
              type="button"
              className={asyncViewActionClassName}
              disabled={Boolean(retryingError) || cooldownSeconds > 0}
              onClick={() =>
                void retry(null, () => refreshSession().then(completeRefresh))
              }
            >
              {retryingError
                ? "로딩 중"
                : cooldownSeconds > 0
                  ? `${cooldownSeconds}초 후 다시 시도`
                  : "다시 시도"}
            </button>
          }
        />
      </main>
    );
  }

  return status === "ready" ? children : <SessionSplash />;
}

function SessionSplash() {
  return (
    <div
      role="status"
      aria-label="로그인 상태를 확인하는 중"
      className="flex-1 px-5 pt-[calc(54px+var(--safe-top))] pb-5"
    >
      <Image
        src={stackedLogo}
        alt=""
        sizes="200px"
        priority
        className="mx-auto size-[200px] rounded-2xl"
      />
    </div>
  );
}
