"use client";

import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

import { expireSession } from "@/_app/providers/session-expiry";
import { refreshSession } from "@/shared/api";
import stackedLogo from "@/shared/assets/logo/logo-stacked.webp";

type SessionGateProps = {
  needsRenewal: boolean;
  children: ReactNode;
};

export function SessionGate({ needsRenewal, children }: SessionGateProps) {
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(!needsRenewal);

  useEffect(() => {
    if (isReady) {
      return;
    }

    let isCancelled = false;

    void refreshSession().then((result) => {
      if (isCancelled) {
        return;
      }
      if (result === "rejected") {
        expireSession(queryClient);
        return;
      }
      setIsReady(true);
    });

    return () => {
      isCancelled = true;
    };
  }, [isReady, queryClient]);

  return isReady ? children : <SessionSplash />;
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
