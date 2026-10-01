import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, SessionExpiredError } from "@/shared/api";

const sentry = vi.hoisted(() => ({
  captureException: vi.fn(),
  scope: {
    setTags: vi.fn(),
    setContext: vi.fn(),
    setFingerprint: vi.fn(),
    setLevel: vi.fn(),
  },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: sentry.captureException,
  withScope: (callback: (scope: typeof sentry.scope) => void) =>
    callback(sentry.scope),
}));

import { reportOperationFailure } from "./report-operation-failure";

afterEach(() => vi.clearAllMocks());

describe("서비스 오류 보고 정책", () => {
  it("API 응답 원문과 실제 ID 없이 상태·코드·고정 경로를 보낸다", () => {
    reportOperationFailure(
      new ApiError(503, {
        code: "INGREDIENT-503-001",
        title: "비밀 재료명",
        detail: "사용자 이름과 재료명",
      }),
      { monitoringOperation: "ingredient.list" },
    );

    expect(sentry.scope.setTags).toHaveBeenCalledWith({
      feature: "ingredient",
      operation: "ingredient.list",
      failure_type: "api",
      http_status: "503",
      service_code: "INGREDIENT-503-001",
    });
    expect(sentry.scope.setContext).toHaveBeenCalledWith("operation", {
      method: "GET",
      route: "/refrigerators/[refrigeratorId]/ingredients",
      failureType: "api",
      step: undefined,
      status: "503",
      code: "INGREDIENT-503-001",
    });
    expect(sentry.captureException.mock.calls[0][0].message).toBe(
      "ingredient.list failed (api)",
    );
  });

  it("일반 4xx·세션 만료·취소·미등록 작업은 제외한다", () => {
    reportOperationFailure(
      new ApiError(409, { code: "INGREDIENT-409-001", title: "충돌" }),
      { monitoringOperation: "ingredient.register" },
    );
    reportOperationFailure(new SessionExpiredError(), {
      monitoringOperation: "notification.list",
    });
    reportOperationFailure(new DOMException("cancel", "AbortError"), {
      monitoringOperation: "ingredient.list",
    });
    reportOperationFailure(new Error("ignored"), {
      monitoringOperation: "other.operation",
    });

    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("푸시 구독의 실패 단계와 최종 4xx는 구분해 남긴다", () => {
    reportOperationFailure(
      Object.assign(new Error("비밀 endpoint"), {
        name: "PushRegistrationFailure",
        step: "register",
        status: 409,
        code: "PUSH-409-001",
      }),
      { monitoringOperation: "push.register" },
    );

    expect(sentry.scope.setTags).toHaveBeenCalledWith({
      feature: "push",
      operation: "push.register",
      failure_type: "api",
      push_step: "register",
      http_status: "409",
      service_code: "PUSH-409-001",
    });
    expect(sentry.scope.setFingerprint).toHaveBeenCalledWith([
      "push.register",
      "api",
      "register",
      "409",
      "PUSH-409-001",
    ]);
    expect(sentry.captureException.mock.calls[0][0].message).toBe(
      "push.register failed (api)",
    );
  });
});
