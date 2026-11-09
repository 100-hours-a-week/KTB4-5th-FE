"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { clearCurrentRefrigeratorId } from "@/entities/refrigerator";
import { rotateNotificationSessionScope } from "@/entities/notification";
import { releasePushSubscription } from "@/entities/push-subscription";
import {
  clearIntentionalLogout,
  markIntentionalLogout,
  refreshCsrfToken,
  SessionExpiredError,
} from "@/shared/api";
import { loginRedirectReasons, routes } from "@/shared/routes";
import { showAppToast } from "@/shared/ui/app-toast";

import { logout } from "../api/logout";

const LOGOUT_ERROR_MESSAGE = "로그아웃하지 못했어요. 다시 시도해 주세요";

export function useLogout() {
  const queryClient = useQueryClient();

  function leaveSession(sessionExpired: boolean) {
    queryClient.clear();
    clearCurrentRefrigeratorId();
    rotateNotificationSessionScope();
    void refreshCsrfToken().catch(() => {
      // 로그인 화면 진입 후 CSRF 발급을 다시 시도한다.
    });
    window.location.replace(
      sessionExpired
        ? routes.loginWithReason(loginRedirectReasons.sessionExpired)
        : routes.login,
    );
  }

  return useMutation({
    mutationFn: async () => {
      markIntentionalLogout();
      await releasePushSubscription();
      try {
        await logout();
        return false;
      } catch (error) {
        if (error instanceof SessionExpiredError) return true;
        throw error;
      }
    },
    onSuccess: leaveSession,
    onError: () => {
      clearIntentionalLogout();
      showAppToast({
        message: LOGOUT_ERROR_MESSAGE,
        variant: "error",
        dedupeKey: "logout-error",
      });
    },
  });
}
