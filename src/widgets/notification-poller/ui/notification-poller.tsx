"use client";

import { useNotificationSessionScope } from "@/entities/notification";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";

import { useNotificationPolling } from "../model/use-notification-polling";

function ActiveNotificationPoller({
  userScope,
  refrigeratorId,
}: {
  userScope: string;
  refrigeratorId: string;
}) {
  useNotificationPolling(userScope, refrigeratorId);
  return null;
}

export function NotificationPoller() {
  const userScope = useNotificationSessionScope();
  const refrigeratorId = useCurrentRefrigeratorId();

  if (!userScope || !refrigeratorId) return null;

  return (
    <ActiveNotificationPoller
      key={`${userScope}:${refrigeratorId}`}
      userScope={userScope}
      refrigeratorId={refrigeratorId}
    />
  );
}
