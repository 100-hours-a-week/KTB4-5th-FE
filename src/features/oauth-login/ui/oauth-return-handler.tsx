"use client";

import { useMutation } from "@tanstack/react-query";
import * as Sentry from "@sentry/nextjs";
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
    const oauthPending = consumeOAuthLoginStarted();
    const entry = window.location.pathname.startsWith(routes.login)
      ? "login"
      : window.location.pathname.startsWith(routes.signup)
        ? "signup"
        : "app";
    Sentry.logger.info("oauth.entry", {
      entry,
      oauth_pending: oauthPending,
      standalone:
        window.matchMedia?.("(display-mode: standalone)").matches ?? false,
      visibility: document.visibilityState,
    });
    if (!oauthPending) {
      return;
    }

    const isSignedIn = entry === "app";

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
