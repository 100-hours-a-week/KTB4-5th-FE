"use client";

import { useNotificationSessionScope } from "@/entities/notification";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";

import { useNotificationSse } from "../model/use-notification-sse";

function ActiveNotificationPoller({
  userScope,
  refrigeratorId,
}: {
  userScope: string;
  refrigeratorId: string;
}) {
  useNotificationSse(userScope, refrigeratorId);
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
