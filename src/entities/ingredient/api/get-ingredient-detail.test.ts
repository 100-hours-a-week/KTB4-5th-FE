import { afterEach, expect, it, vi } from "vitest";

import { getIngredientDetail } from "./get-ingredient-detail";

afterEach(() => vi.unstubAllGlobals());

it("keeps the detail base date and ETag outside the ingredient", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            code: "INGREDIENT-200-003",
            message: "재고 상세 조회 성공",
            data: {
              baseDate: "2026-09-16",
              ingredientId: "1",
              name: "두부",
              category: "TOFU_BEAN",
              storageType: "REFRIGERATED",
              measureType: "WEIGHT",
              quantity: null,
              weightValue: "300.000",
              weightUnit: "G",
              expirationDate: "2026-09-15",
              createdDate: "2026-09-01",
              status: "EXPIRED",
              daysUntilExpiration: -1,
            },
          }),
          { status: 200, headers: { ETag: '"sha256-example"' } },
        ),
    ),
  );

  const result = await getIngredientDetail({ ingredientId: "1" });
  expect(result.baseDate).toBe("2026-09-16");
  expect(result.etag).toBe('"sha256-example"');
  expect(result.ingredient.weightValue).toBe(300);
  expect(result.ingredient).not.toHaveProperty("baseDate");
});
