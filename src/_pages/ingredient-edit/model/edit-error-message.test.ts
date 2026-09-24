import { describe, expect, it } from "vitest";

import { ApiError, SessionExpiredError } from "@/shared/api";

import { getEditErrorMessage } from "./edit-error-message";

const cases = [
  ["INGREDIENT-400-003", 400, "입력값을 다시 확인해 주세요"],
  ["REFRIGERATOR-403-001", 403, "냉장고 접근 권한을 확인해 주세요"],
  ["INGREDIENT-404-001", 404, "존재하지 않는 냉장고예요"],
  [
    "INGREDIENT-412-001",
    412,
    "다른 곳에서 수정됐어요. 최신 내용을 확인해 주세요",
  ],
  ["INGREDIENT-428-001", 428, "재고 버전 정보가 없어요. 다시 불러와 주세요"],
  ["INGREDIENT-422-001", 422, "재료 이름을 확인해 주세요"],
  ["INGREDIENT-422-002", 422, "재고 수량을 확인해 주세요"],
  ["INGREDIENT-422-003", 422, "측정값과 단위를 확인해 주세요"],
  ["INGREDIENT-422-004", 422, "유통기한을 확인해 주세요"],
  ["GLOBAL-500-001", 500, "잠시 후 다시 시도해 주세요"],
] as const;

describe("ingredient edit errors", () => {
  it.each(cases)("maps %s", (code, status, message) => {
    expect(
      getEditErrorMessage(new ApiError(status, { code, title: "오류" })),
    ).toBe(message);
  });

  it("leaves an expired session to the global auth handler", () => {
    expect(getEditErrorMessage(new SessionExpiredError())).toBeNull();
  });
});
