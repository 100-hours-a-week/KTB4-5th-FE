import { cookies } from "next/headers";

import { SessionGate } from "@/_app/providers/session-gate";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@/shared/api";
import { NotificationPoller } from "@/widgets/notification-poller";

export default async function ProtectedLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const needsRenewal =
    !cookieStore.has(ACCESS_TOKEN_COOKIE_NAME) &&
    cookieStore.has(REFRESH_TOKEN_COOKIE_NAME);

  return (
    <SessionGate needsRenewal={needsRenewal}>
      <NotificationPoller />
      {children}
    </SessionGate>
  );
}
