import type { QueryClient } from "@tanstack/react-query";

import { clearCurrentRefrigeratorId } from "@/entities/refrigerator";
import { rotateNotificationSessionScope } from "@/entities/notification";
import { clearLocalPushSubscription } from "@/entities/push-subscription";
import { loginRedirectReasons, routes } from "@/shared/routes";

let isRedirectingToLogin = false;

export function expireSession(queryClient: QueryClient) {
  if (isRedirectingToLogin) {
    return;
  }

  queryClient.clear();

  if (typeof window !== "undefined") {
    isRedirectingToLogin = true;
    clearCurrentRefrigeratorId();
    rotateNotificationSessionScope();
    void clearLocalPushSubscription();
    window.location.replace(
      routes.loginWithReason(loginRedirectReasons.sessionExpired),
    );
  }
}
