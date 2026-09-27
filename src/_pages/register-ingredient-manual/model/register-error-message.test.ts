import { describe, expect, it } from "vitest";

import { ApiError, SessionExpiredError } from "@/shared/api";

import { getRegisterErrorMessage } from "./register-error-message";

const ERROR_CASES = [
  [400, "등록한 재료 입력값을 다시 확인해 주세요"],
  [401, "로그인이 필요해요"],
  [403, "냉장고 접근 권한을 확인해 주세요"],
  [404, "존재하지 않는 냉장고예요"],
  [409, "냉장고 용량 또는 재고 합산 한도를 확인해 주세요"],
  [422, "사용할 수 없는 재료 이름이 포함돼 있어요"],
] as const;

function createApiError(status: number) {
  return new ApiError(status, {
    code: `INGREDIENT-${status}-001`,
    title: `HTTP ${status}`,
    status,
  });
}

describe("register error messages", () => {
  it.each(ERROR_CASES)("maps an HTTP %i failure", (status, message) => {
    expect(getRegisterErrorMessage(createApiError(status))).toBe(message);
  });

  it("maps a fetch network failure", () => {
    expect(getRegisterErrorMessage(new TypeError("Failed to fetch"))).toBe(
      "인터넷 연결을 확인해 주세요",
    );
  });

  it("leaves session-expired feedback to the global auth handler", () => {
    expect(getRegisterErrorMessage(new SessionExpiredError())).toBeNull();
  });

  it("uses a safe fallback for an unknown failure", () => {
    expect(getRegisterErrorMessage(new Error("unexpected"))).toBe(
      "재고 등록에 실패했어요",
    );
  });
});
