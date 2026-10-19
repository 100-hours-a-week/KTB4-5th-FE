"use client";

import { useEffect, useState } from "react";

import { showAppToast } from "@/shared/ui/app-toast";

import { getOAuthAuthorizationPath } from "../api/oauth-authorization-path";
import { markOAuthLoginStarted } from "../model/oauth-return";

export function KakaoLoginButton() {
  const [isPending, setIsPending] = useState(false);
  const authorizationPath = getOAuthAuthorizationPath("kakao");

  useEffect(() => {
    const restoreButton = (event: PageTransitionEvent) => {
      if (event.persisted) setIsPending(false);
    };

    window.addEventListener("pageshow", restoreButton);
    return () => window.removeEventListener("pageshow", restoreButton);
  }, []);

  async function handleClick() {
    if (isPending) return;

    setIsPending(true);
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration?.active) {
        await registration.navigationPreload?.disable();
      }

      markOAuthLoginStarted();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.location.assign(authorizationPath));
      });
    } catch {
      setIsPending(false);
      showAppToast({
        message: "잠시 후 다시 시도해 주세요",
        variant: "error",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending || undefined}
      className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[4px] bg-[#FEE500] px-5 py-3 font-app-heading text-[15px] font-black text-black/85 shadow-app-md hover:brightness-95"
    >
      {isPending ? (
        <span
          aria-hidden="true"
          className="size-[18px] animate-spin rounded-full border-2 border-black/85 border-r-transparent"
        />
      ) : (
        <svg
          viewBox="0 0 18 18"
          aria-hidden="true"
          focusable="false"
          className="size-[18px] fill-black"
        >
          <path d="M9 1.5C4.58 1.5 1 4.32 1 7.8c0 2.24 1.49 4.2 3.73 5.32l-.95 3.48c-.08.3.26.54.52.37l4.15-2.74c.18.02.36.03.55.03 4.42 0 8-2.82 8-6.3S13.42 1.5 9 1.5z" />
        </svg>
      )}
      {isPending ? "냉장고로 이동 중..." : "카카오로 시작하기"}
    </button>
  );
}
