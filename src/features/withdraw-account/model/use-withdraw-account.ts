"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { clearCurrentRefrigeratorId } from "@/entities/refrigerator";
import { rotateNotificationSessionScope } from "@/entities/notification";
import { releasePushSubscription } from "@/entities/push-subscription";
import {
  clearIntentionalLogout,
  markIntentionalLogout,
  refreshCsrfToken,
} from "@/shared/api";
import { routes } from "@/shared/routes";
import { showAppToast } from "@/shared/ui/app-toast";

import { withdrawAccount } from "../api/withdraw-account";

export function useWithdrawAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      markIntentionalLogout();
      await releasePushSubscription();
      return withdrawAccount();
    },
    onSuccess: () => {
      queryClient.clear();
      clearCurrentRefrigeratorId();
      rotateNotificationSessionScope();
      void refreshCsrfToken();
      window.location.replace(routes.login);
    },
    onError: () => {
      clearIntentionalLogout();
      showAppToast({
        message: "탈퇴하지 못했어요. 다시 시도해 주세요",
        variant: "error",
        dedupeKey: "withdraw-account-error",
      });
    },
  });
}
