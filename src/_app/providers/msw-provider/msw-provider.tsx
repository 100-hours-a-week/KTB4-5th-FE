"use client";

import { useEffect, type ReactNode } from "react";

import { isMswActive } from "../../mocks/enabled";

let startPromise: Promise<unknown> | undefined;

export function MswProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!isMswActive()) return;

    startPromise ??= import("../../mocks/browser")
      .then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" }))
      .catch((error: unknown) => {
        startPromise = undefined;
        console.error("MSW 시작 실패", error);
      });
  }, []);

  return children;
}
