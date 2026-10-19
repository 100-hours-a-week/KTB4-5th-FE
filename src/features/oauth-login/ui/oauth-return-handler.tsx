"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

import { resubscribePushNotificationsIfEnabled } from "@/features/manage-push-notifications";
import { refreshCsrfToken } from "@/shared/api";
import { routes } from "@/shared/routes";

import { consumeOAuthLoginStarted } from "../model/oauth-return";

export function OAuthReturnHandler() {
  const { mutate: resubscribe } = useMutation({
    meta: { monitoringOperation: "push.resubscribe" },
    mutationFn: resubscribePushNotificationsIfEnabled,
  });

  useEffect(() => {
    if (!consumeOAuthLoginStarted()) {
      return;
    }

    const isSignedIn =
      !window.location.pathname.startsWith(routes.login) &&
      !window.location.pathname.startsWith(routes.signup);

    void refreshCsrfToken()
      .catch(() => null)
      .then(() => {
        if (isSignedIn) {
          resubscribe();
        }
      });
  }, [resubscribe]);

  return null;
}
