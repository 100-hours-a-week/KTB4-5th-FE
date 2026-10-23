import { expect, it } from "vitest";
import { ApiError } from "@/shared/api";
import { getRegisterErrorMessage } from "./register-error-message";
it("분석 결과 404와 냉장고 404를 구분한다", () => {
  expect(
    getRegisterErrorMessage(
      new ApiError(404, { code: "IMAGE-404-001", title: "expired" }),
    ),
  ).toContain("분석 결과");
  expect(
    getRegisterErrorMessage(
      new ApiError(404, { code: "REFRIGERATOR-404-001", title: "missing" }),
    ),
  ).toBe("존재하지 않는 냉장고예요");
});
