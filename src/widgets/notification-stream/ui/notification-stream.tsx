"use client";

import { useNotificationSessionScope } from "@/entities/notification";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";

import { useNotificationSse } from "../model/use-notification-sse";

function ActiveNotificationStream({
  userScope,
  refrigeratorId,
}: {
  userScope: string;
  refrigeratorId: string;
}) {
  useNotificationSse(userScope, refrigeratorId);
  return null;
}

export function NotificationStream() {
  const userScope = useNotificationSessionScope();
  const refrigeratorId = useCurrentRefrigeratorId();

  if (!userScope || !refrigeratorId) return null;

  return (
    <ActiveNotificationStream
      key={`${userScope}:${refrigeratorId}`}
      userScope={userScope}
      refrigeratorId={refrigeratorId}
    />
  );
}
