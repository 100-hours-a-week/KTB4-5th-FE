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
  "signup-expired": "가입 시간이 지났어요. 다시 시작해 주세요",
  "already-registered": "이미 가입된 계정이에요. 다시 로그인해 주세요",
};

const OAUTH_ERROR_PARAM = "error";
const OAUTH_LOGIN_FAILED = "OAUTH_LOGIN_FAILED";

export function LoginRedirectNotice() {
  const searchParams = useSearchParams();
  const reason = searchParams.get(LOGIN_REDIRECT_REASON_PARAM);
  const oauthError = searchParams.get(OAUTH_ERROR_PARAM);

  useEffect(() => {
    if (isLoginRedirectReason(reason)) {
      showAppToast({
        message: REDIRECT_NOTICE_MESSAGES[reason],
        variant: "error",
        dedupeKey: `login-redirect:${reason}`,
      });
    } else if (oauthError === OAUTH_LOGIN_FAILED) {
      showAppToast({
        message: "잠시 후 다시 시도해 주세요",
        variant: "error",
        dedupeKey: `login-oauth:${oauthError}`,
      });
    } else if (oauthError === null) {
      return;
    }

    window.history.replaceState(null, "", routes.login);
  }, [reason, oauthError]);

  return null;
}
