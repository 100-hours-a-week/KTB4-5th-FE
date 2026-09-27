import { expect, it } from "vitest";

import { ApiError, SessionExpiredError } from "@/shared/api";

import { getExpireErrorMessage } from "./expire-error-message";

function error(status: number, code = `INGREDIENT-${status}-001`) {
  return new ApiError(status, { code, title: "오류" });
}

it.each([
  [400, "처리할 재고 값을 확인해 주세요"],
  [422, "처리할 재고 값을 확인해 주세요"],
  [403, "냉장고 접근 권한을 확인해 주세요"],
  [404, "재고를 찾을 수 없어요. 목록을 다시 확인해 주세요"],
  [412, "다른 곳에서 수정됐어요. 최신 재고를 확인해 주세요"],
  [428, "재고 버전 정보가 없어요. 다시 불러와 주세요"],
] as const)("maps HTTP %i to an actionable message", (status, message) => {
  expect(getExpireErrorMessage(error(status))).toBe(message);
});

it("uses the global session handler for 401 and distinguishes CSRF errors", () => {
  expect(getExpireErrorMessage(new SessionExpiredError())).toBeNull();
  expect(getExpireErrorMessage(error(403, "COMMON-403-CSRF-001"))).toBe(
    "보안 인증에 실패했어요. 다시 시도해 주세요",
  );
  expect(getExpireErrorMessage(new TypeError("fetch failed"))).toBe(
    "인터넷 연결을 확인해 주세요",
  );
});
