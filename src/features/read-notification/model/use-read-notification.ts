"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { refreshNotificationQueries } from "@/entities/notification";
import { showAppToast } from "@/shared/ui/app-toast";

import { readNotification } from "../api/read-notification";

type ReadNotificationRequest = {
  notificationId: string;
  userScope: string;
  refrigeratorId: string;
};

export function useReadNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ notificationId }: ReadNotificationRequest) =>
      readNotification(notificationId),
    onSuccess: (_data, request) => {
      void refreshNotificationQueries(
        queryClient,
        request.userScope,
        request.refrigeratorId,
      ).catch(() => {
        showAppToast({
          message: "읽음 상태를 다시 불러오지 못했어요",
          variant: "error",
          dedupeKey: "notification-refresh-error",
        });
      });
    },
    onError: () => {
      showAppToast({
        message: "알림을 읽음 처리하지 못했어요",
        variant: "error",
        dedupeKey: "read-notification-error",
      });
    },
  });
}
