"use client";

import { useEffect, useState, type ReactNode } from "react";

import { AsyncViewState } from "@/shared/ui/async-view-state";

import { isMswActive, isMswEnabled } from "../../mocks/enabled";

let startPromise: Promise<unknown> | undefined;

export function MswProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(() => !isMswEnabled());

  useEffect(() => {
    if (isReady) return;

    startPromise ??= isMswActive()
      ? import("../../mocks/browser")
          .then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" }))
          .catch((error: unknown) => {
            startPromise = undefined;
            console.error("MSW 시작 실패", error);
          })
      : Promise.resolve();
    void startPromise.then(() => setIsReady(true));
  }, [isReady]);

  if (isReady) return children;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-[min(100%,var(--app-max-width))] items-center justify-center bg-app-bg [background-image:repeating-linear-gradient(180deg,transparent_0_25px,rgb(26_26_30_/_3%)_25px_26px)]">
      <AsyncViewState status="loading" title="화면을 불러오는 중입니다" />
    </div>
  );
}
