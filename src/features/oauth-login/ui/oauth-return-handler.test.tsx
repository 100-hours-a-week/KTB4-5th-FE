// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { OAuthReturnHandler } from "./oauth-return-handler";

const { consumeOAuthLoginStarted, refreshCsrfToken, resubscribe, logInfo } =
  vi.hoisted(() => ({
    consumeOAuthLoginStarted: vi.fn(),
    refreshCsrfToken: vi.fn().mockResolvedValue(null),
    resubscribe: vi.fn(),
    logInfo: vi.fn(),
  }));
vi.mock("../model/oauth-return", () => ({ consumeOAuthLoginStarted }));
vi.mock("@/shared/api", () => ({ refreshCsrfToken }));
vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutate: resubscribe }),
}));
vi.mock("@/features/manage-push-notifications", () => ({
  resubscribePushNotificationsIfEnabled: vi.fn(),
}));
vi.mock("@sentry/nextjs", () => ({ logger: { info: logInfo } }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/");
});

it.each([
  ["/login?code=SECRET_TOKEN", "login", false],
  ["/login?error=SECRET_ERROR", "login", true],
  ["/signup/profile?code=SECRET_TOKEN", "signup", true],
  ["/refrigerator/ingredients/SECRET_USER_ID?code=SECRET_TOKEN", "app", true],
] as const)(
  "records a fixed entry category for %s without sensitive values",
  async (path, entry, pending) => {
    window.history.replaceState(null, "", path);
    consumeOAuthLoginStarted.mockReturnValue(pending);
    render(<OAuthReturnHandler />);
    await act(async () => {});

    expect(logInfo).toHaveBeenCalledExactlyOnceWith("oauth.entry", {
      entry,
      oauth_pending: pending,
      standalone: false,
      visibility: document.visibilityState,
    });
    expect(JSON.stringify(logInfo.mock.calls)).not.toContain("SECRET");
    expect(refreshCsrfToken).toHaveBeenCalledTimes(pending ? 1 : 0);
    expect(resubscribe).toHaveBeenCalledTimes(
      pending && entry === "app" ? 1 : 0,
    );
  },
);
