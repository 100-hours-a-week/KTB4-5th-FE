"use client";

import { ChevronLeftOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";

import {
  DEFAULT_INGREDIENT_LIST_SORT,
  toIngredientListQueryString,
} from "@/entities/ingredient";
import type { Notification } from "@/entities/notification";
import { routes } from "@/shared/routes";
import { LinkCard } from "@/shared/ui/link-card";

type NotificationCardProps = {
  notification: Notification;
};

function toNotificationHref(type: Notification["type"]) {
  if (type === "MEMBER") return routes.home;

  const queryString = toIngredientListQueryString({
    filter: type,
    sort: DEFAULT_INGREDIENT_LIST_SORT,
  });

  return queryString
    ? `${routes.refrigerator}?${queryString}`
    : routes.refrigerator;
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const isUnread = notification.readAt === null;

  return (
    <LinkCard
      href={toNotificationHref(notification.type)}
      title={
        <span className="flex min-w-0 items-center gap-2">
          {isUnread ? (
            <>
              <span
                aria-hidden="true"
                className="size-1.5 flex-none rounded-full bg-app-primary"
              />
              <span className="sr-only">읽지 않음</span>
            </>
          ) : null}
          <span className="truncate">{notification.title}</span>
        </span>
      }
      description={notification.body}
      trailing={
        <>
          <Lineicons
            icon={ChevronLeftOutlined}
            size={16}
            strokeWidth={2}
            aria-hidden="true"
            focusable="false"
            className="rotate-180 text-app-ink/45"
          />
          <span className="sr-only">더보기</span>
        </>
      }
    />
  );
}
