"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setCurrentRefrigeratorId } from "@/entities/refrigerator";
import { rotateNotificationSessionScope } from "@/entities/notification";
import { releasePushSubscription } from "@/entities/push-subscription";
import { ApiError, refreshCsrfToken } from "@/shared/api";
import { routes } from "@/shared/routes";
import { showAppToast } from "@/shared/ui/app-toast";

import { logout } from "../api/logout";

const LOGOUT_ERROR_MESSAGE = "로그아웃하지 못했어요. 다시 시도해 주세요";

function isAlreadyLoggedOut(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function useLogout() {
  const queryClient = useQueryClient();

  function leaveSession() {
    queryClient.clear();
    setCurrentRefrigeratorId(null);
    rotateNotificationSessionScope();
    void refreshCsrfToken();
    window.location.replace(routes.login);
  }

  return useMutation({
    mutationFn: async () => {
      await releasePushSubscription();
      return logout();
    },
    onSuccess: leaveSession,
    onError: (error) => {
      if (isAlreadyLoggedOut(error)) {
        leaveSession();
        return;
      }

      showAppToast({
        message: LOGOUT_ERROR_MESSAGE,
        variant: "error",
        dedupeKey: "logout-error",
      });
    },
  });
}
