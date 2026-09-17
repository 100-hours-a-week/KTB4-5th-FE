import { Bell1Outlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";

import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";

type NotificationBellProps = {
  unreadCount?: number;
};

export function NotificationBell({}: NotificationBellProps) {
  return (
    <AppLink
      className="relative grid size-[var(--tap-min)] place-items-center text-app-text no-underline hover:text-app-primary"
      href={routes.notifications}
    >
      <Lineicons
        icon={Bell1Outlined}
        size={23}
        strokeWidth={1.8}
        aria-hidden="true"
        focusable="false"
      />
    </AppLink>
  );
}
