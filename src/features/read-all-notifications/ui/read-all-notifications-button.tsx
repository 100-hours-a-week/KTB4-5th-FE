"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  refreshNotificationQueries,
  useNotificationSessionScope,
} from "@/entities/notification";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { showAppToast } from "@/shared/ui/app-toast";

import { readAllNotifications } from "../api/read-all-notifications";

type ReadAllNotificationsButtonProps = {
  unreadCount?: number;
};

export function ReadAllNotificationsButton({
  unreadCount,
}: ReadAllNotificationsButtonProps) {
  const queryClient = useQueryClient();
  const refrigeratorId = useCurrentRefrigeratorId();
  const userScope = useNotificationSessionScope();
  const mutation = useMutation({
    meta: { monitoringOperation: "notification.readAll" },
    mutationFn: ({
      refrigeratorId,
    }: {
      refrigeratorId: string;
      userScope: string;
    }) => readAllNotifications(refrigeratorId),
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
        message: "알림을 모두 읽음 처리하지 못했어요",
        variant: "error",
        dedupeKey: "read-all-notifications-error",
      });
    },
  });

  const disabled =
    !refrigeratorId || !userScope || mutation.isPending || unreadCount === 0;

  function handleClick() {
    if (disabled) return;
    mutation.mutate({ refrigeratorId, userScope });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="min-h-[var(--tap-min)] border-0 bg-transparent px-1 text-[14px] font-bold text-app-ink hover:text-app-primary disabled:text-app-neutral-400"
    >
      모두 읽음
    </button>
  );
}
