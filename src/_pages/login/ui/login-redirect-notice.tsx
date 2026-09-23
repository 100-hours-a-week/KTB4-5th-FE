"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  isLoginRedirectReason,
  LOGIN_REDIRECT_REASON_PARAM,
  routes,
  type LoginRedirectReason,
} from "@/shared/routes";
import { showAppToast } from "@/shared/ui/app-toast";

const REDIRECT_NOTICE_MESSAGES: Record<LoginRedirectReason, string> = {
  "auth-required": "로그인이 필요한 화면이에요",
  "session-expired": "로그인이 만료됐어요. 다시 로그인해 주세요",
};

export function LoginRedirectNotice() {
  const searchParams = useSearchParams();
  const reason = searchParams.get(LOGIN_REDIRECT_REASON_PARAM);

  useEffect(() => {
    if (!isLoginRedirectReason(reason)) {
      return;
    }

    showAppToast({
      message: REDIRECT_NOTICE_MESSAGES[reason],
      variant: "error",
      dedupeKey: `login-redirect:${reason}`,
    });

    window.history.replaceState(null, "", routes.login);
  }, [reason]);

  return null;
}
