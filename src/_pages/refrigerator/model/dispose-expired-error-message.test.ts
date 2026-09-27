import { expect, it } from "vitest";

import { ApiError, SessionExpiredError } from "@/shared/api";

import { getDisposeExpiredErrorMessage } from "./dispose-expired-error-message";

function error(status: number, code = `INGREDIENT-${status}-001`) {
  return new ApiError(status, { code, title: "오류" });
}

it.each([
  [400, "선택한 재료를 다시 확인해 주세요"],
  [403, "냉장고 접근 권한을 확인해 주세요"],
  [404, "냉장고를 찾을 수 없어요. 다시 확인해 주세요"],
] as const)("maps HTTP %i to an actionable message", (status, message) => {
  expect(getDisposeExpiredErrorMessage(error(status))).toBe(message);
});

it("leaves session expiry to the global handler and maps transport failures", () => {
  expect(getDisposeExpiredErrorMessage(new SessionExpiredError())).toBeNull();
  expect(getDisposeExpiredErrorMessage(error(403, "COMMON-403-CSRF-001"))).toBe(
    "보안 인증에 실패했어요. 다시 시도해 주세요",
  );
  expect(getDisposeExpiredErrorMessage(new TypeError("fetch failed"))).toBe(
    "인터넷 연결을 확인해 주세요",
  );
});
