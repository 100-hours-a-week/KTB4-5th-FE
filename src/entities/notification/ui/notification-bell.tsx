import { Bell1Outlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";

import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";

type NotificationBellProps = {
  unreadCount?: number;
};

const UNREAD_BADGE_MAX = 99;

export function NotificationBell({ unreadCount = 0 }: NotificationBellProps) {
  const hasUnread = unreadCount > 0;

  return (
    <AppLink
      className="relative grid size-[var(--tap-min)] place-items-center text-app-text no-underline hover:text-app-primary"
      href={routes.notifications}
      aria-label={hasUnread ? `알림, 읽지 않은 알림 ${unreadCount}개` : "알림"}
    >
      <Lineicons
        icon={Bell1Outlined}
        size={23}
        strokeWidth={1.8}
        aria-hidden="true"
        focusable="false"
      />
      {hasUnread ? (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-app-primary px-1 text-[10px] leading-none font-bold text-app-canvas"
        >
          {Math.min(unreadCount, UNREAD_BADGE_MAX)}
        </span>
      ) : null}
    </AppLink>
  );
}
