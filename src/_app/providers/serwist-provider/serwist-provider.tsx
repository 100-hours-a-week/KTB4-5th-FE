"use client";

import * as Sentry from "@sentry/nextjs";
import {
  SerwistProvider as SerwistRuntimeProvider,
  useSerwist,
} from "@serwist/turbopack/react";
import { useEffect, useRef, type ReactNode } from "react";

import { isMswActive } from "../../mocks/enabled";

type SerwistProviderProps = {
  children: ReactNode;
};

const swUrl = "/serwist/sw.js";

function RegisterServiceWorker() {
  const { serwist } = useSerwist();
  const started = useRef(false);

  useEffect(() => {
    if (!serwist || started.current || isMswActive()) return;
    started.current = true;

    void serwist.register().catch((cause: unknown) => {
      const error =
        cause instanceof Error || cause instanceof DOMException
          ? cause
          : new Error(String(cause));

      Sentry.withScope((scope) => {
        scope.setContext("service_worker_registration", {
          swUrl,
          errorName: error.name,
          errorMessage: error.message,
          userAgent: navigator.userAgent,
        });
        Sentry.captureException(error);
      });
    });
  }, [serwist]);

  return null;
}

export function SerwistProvider({ children }: SerwistProviderProps) {
  return (
    <SerwistRuntimeProvider swUrl={swUrl} register={false}>
      <RegisterServiceWorker />
      {children}
    </SerwistRuntimeProvider>
  );
}
