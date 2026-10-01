import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api";

const dependencies = vi.hoisted(() => ({
  getNotificationPreferences: vi.fn(),
  isExpirationNotificationEnabled: vi.fn(),
  isPushOptedOut: vi.fn(),
  getPushNotificationSupport: vi.fn(),
  registerWebPush: vi.fn(),
}));

vi.mock("client-only", () => ({}));
vi.mock("@/entities/notification", () => ({
  getNotificationPreferences: dependencies.getNotificationPreferences,
  isExpirationNotificationEnabled: dependencies.isExpirationNotificationEnabled,
}));
vi.mock("@/entities/push-subscription", () => ({
  isPushOptedOut: dependencies.isPushOptedOut,
}));
vi.mock("./push-notification-subscription", () => ({
  getPushNotificationSupport: dependencies.getPushNotificationSupport,
  registerWebPush: dependencies.registerWebPush,
}));

import { resubscribePushNotificationsIfEnabled } from "./resubscribe-push-notifications";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("로그인 후 푸시 자동 재구독", () => {
  it("지원하지 않는 기기에서는 요청하지 않는다", async () => {
    dependencies.getPushNotificationSupport.mockReturnValue("unsupported");

    await expect(
      resubscribePushNotificationsIfEnabled(),
    ).resolves.toBeUndefined();

    expect(dependencies.getNotificationPreferences).not.toHaveBeenCalled();
    expect(dependencies.registerWebPush).not.toHaveBeenCalled();
  });

  it("최종 구독 실패를 보고할 수 있도록 호출 측에 전달한다", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    dependencies.getPushNotificationSupport.mockReturnValue("supported");
    dependencies.isPushOptedOut.mockReturnValue(false);
    dependencies.getNotificationPreferences.mockResolvedValue({
      notificationPreferences: [],
    });
    dependencies.isExpirationNotificationEnabled.mockReturnValue(true);
    dependencies.registerWebPush.mockResolvedValue({
      status: "error",
      step: "register",
      cause: new ApiError(503, {
        code: "PUSH-503-001",
        title: "비밀 구독 정보",
      }),
    });

    await expect(resubscribePushNotificationsIfEnabled()).rejects.toMatchObject(
      {
        name: "PushRegistrationFailure",
        step: "register",
        status: 503,
        code: "PUSH-503-001",
      },
    );
  });
});
