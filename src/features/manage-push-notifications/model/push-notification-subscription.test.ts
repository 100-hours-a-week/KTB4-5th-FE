import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api";

vi.mock("client-only", () => ({}));
vi.mock("@/entities/push-subscription", () => ({
  savePushSubscriptionId: vi.fn(),
  clearPushOptedOut: vi.fn(),
}));
vi.mock("../api/push-subscription", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/push-subscription")>()),
  getVapidPublicKey: vi.fn(),
  registerPushSubscription: vi.fn(),
}));

import {
  clearPushOptedOut,
  savePushSubscriptionId,
} from "@/entities/push-subscription";

import {
  getVapidPublicKey,
  registerPushSubscription,
} from "../api/push-subscription";
import { registerWebPush } from "./push-notification-subscription";

const keys = { p256dh: "public-key", auth: "auth-key" };
const existing = {
  options: { applicationServerKey: new Uint8Array([1, 2, 3]).buffer },
  expirationTime: null,
  toJSON: () => ({ endpoint: "https://push.example/old", keys }),
  unsubscribe: vi.fn(),
};
const renewed = {
  toJSON: () => ({ endpoint: "https://push.example/new", keys }),
};
const subscribe = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("window", { Notification: {}, PushManager: {}, atob });
  vi.stubGlobal("navigator", {
    serviceWorker: {
      ready: Promise.resolve({
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(existing),
          subscribe,
        },
      }),
    },
  });
  vi.mocked(getVapidPublicKey).mockResolvedValue("AQID");
  existing.unsubscribe.mockResolvedValue(true);
  subscribe.mockResolvedValue(renewed);
});

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("푸시 endpoint 복구", () => {
  it.each(["PUSH-409-001", "PUSH-409-002"])(
    "%s이면 구독 해제 후 새 endpoint를 등록한다",
    async (code) => {
      vi.mocked(registerPushSubscription)
        .mockRejectedValueOnce(new ApiError(409, { code, title: "구독 충돌" }))
        .mockResolvedValueOnce("new-subscription-id");

      await expect(registerWebPush()).resolves.toEqual({
        status: "subscribed",
        subscriptionId: "new-subscription-id",
      });

      expect(existing.unsubscribe).toHaveBeenCalledOnce();
      expect(subscribe).toHaveBeenCalledExactlyOnceWith({
        applicationServerKey: new Uint8Array([1, 2, 3]),
        userVisibleOnly: true,
      });
      expect(existing.unsubscribe).toHaveBeenCalledBefore(subscribe);
      expect(registerPushSubscription).toHaveBeenCalledTimes(2);
      expect(registerPushSubscription).toHaveBeenNthCalledWith(
        1,
        existing.toJSON(),
      );
      expect(registerPushSubscription).toHaveBeenNthCalledWith(
        2,
        renewed.toJSON(),
      );
      expect(savePushSubscriptionId).toHaveBeenCalledWith(
        "new-subscription-id",
      );
      expect(clearPushOptedOut).toHaveBeenCalledOnce();
    },
  );

  it.each(["PUSH-409-001", "PUSH-409-002"])(
    "%s 재시도도 실패하면 추가 복구 없이 오류를 반환한다",
    async (code) => {
      const cause = new ApiError(409, { code, title: "구독 충돌" });
      vi.mocked(registerPushSubscription).mockRejectedValue(cause);

      await expect(registerWebPush()).resolves.toEqual({
        status: "error",
        step: "register",
        cause,
      });

      expect(registerPushSubscription).toHaveBeenCalledTimes(2);
      expect(existing.unsubscribe).toHaveBeenCalledOnce();
      expect(subscribe).toHaveBeenCalledOnce();
      expect(savePushSubscriptionId).not.toHaveBeenCalled();
      expect(clearPushOptedOut).not.toHaveBeenCalled();
    },
  );

  it("다른 오류는 구독을 해제하거나 재시도하지 않는다", async () => {
    const cause = new ApiError(503, {
      code: "PUSH-503-001",
      title: "서비스 이용 불가",
    });
    vi.mocked(registerPushSubscription).mockRejectedValue(cause);

    await expect(registerWebPush()).resolves.toEqual({
      status: "error",
      step: "register",
      cause,
    });

    expect(registerPushSubscription).toHaveBeenCalledOnce();
    expect(existing.unsubscribe).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
  });
});
