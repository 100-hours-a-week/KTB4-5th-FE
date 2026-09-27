import { describe, expect, it } from "vitest";

import { ApiError } from "./api-error";
import { readProblem } from "./response-parsing";

describe("ApiProblem and ApiError", () => {
  it("preserves Problem Details and the service error code", async () => {
    const problem = await readProblem(
      new Response(
        JSON.stringify({
          type: "about:blank",
          title: "재고를 찾을 수 없어요",
          detail: "해당 재고가 삭제되었습니다.",
          instance: "/api/v1/ingredients/42",
          code: "INGREDIENT-404-001",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/problem+json" },
        },
      ),
    );

    expect(problem).toMatchObject({
      code: "INGREDIENT-404-001",
      title: "재고를 찾을 수 없어요",
      detail: "해당 재고가 삭제되었습니다.",
      status: 404,
      instance: "/api/v1/ingredients/42",
    });

    const error = new ApiError(404, problem);
    expect(error).toMatchObject({
      name: "ApiError",
      status: 404,
      code: "INGREDIENT-404-001",
      message: "해당 재고가 삭제되었습니다.",
      problem,
    });
  });

  it("uses the API message as the title when Problem Details omits one", async () => {
    const problem = await readProblem(
      new Response(
        JSON.stringify({ message: "서버 오류", code: "INGREDIENT-500-001" }),
        { status: 500 },
      ),
    );

    expect(problem).toMatchObject({
      code: "INGREDIENT-500-001",
      title: "서버 오류",
      status: 500,
    });
  });
});
