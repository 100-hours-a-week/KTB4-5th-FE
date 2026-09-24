import { describe, expect, it } from "vitest";

import { ApiError } from "@/shared/api";

import { getIngredientReadError } from "./ingredient-read-error";

function apiError(status: number) {
  return new ApiError(status, {
    code: `INGREDIENT-${status}-001`,
    title: "서버 원문",
  });
}

describe("getIngredientReadError", () => {
  it("sends missing or forbidden resources back to the refrigerator", () => {
    expect(getIngredientReadError(apiError(404), "detail")).toMatchObject({
      title: "재고를 찾을 수 없어요",
      action: "refrigerator",
    });
    expect(getIngredientReadError(apiError(403), "list")).toMatchObject({
      title: "이 냉장고에 접근할 권한이 없어요",
      action: "refrigerator",
    });
  });

  it("maps authentication and server ApiError responses", () => {
    expect(getIngredientReadError(apiError(401), "detail").action).toBe(
      "login",
    );
    expect(getIngredientReadError(apiError(500), "detail")).toMatchObject({
      title: "서버 오류로 재고를 불러오지 못했어요",
      action: "retry",
    });
  });
});
