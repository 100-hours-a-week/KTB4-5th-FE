import { afterEach, expect, it, vi } from "vitest";

import { getIngredientList } from "./get-ingredient-list";

afterEach(() => vi.unstubAllGlobals());

it("normalizes decimal weight strings while retaining the registered count", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            code: "INGREDIENT-200-001",
            message: "재고 목록 조회 성공",
            data: {
              ingredientsNum: 1,
              filteredCount: 1,
              refrigeratorCapacity: 100,
              nextCursor: null,
              ingredients: [
                {
                  ingredientId: "1",
                  name: "두부",
                  category: "TOFU_BEAN",
                  quantity: 2,
                  weightValue: "400.000",
                  weightUnit: "G",
                  storageType: "REFRIGERATED",
                  status: "NORMAL",
                  daysUntilExpiration: 10,
                },
              ],
            },
          }),
          { status: 200 },
        ),
    ),
  );

  const result = await getIngredientList({
    refrigeratorId: "1",
    query: { filter: null, sort: "EXPIRATION_ASC" },
  });
  expect(result.ingredients[0]).toMatchObject({
    quantity: 2,
    weightValue: 400,
    measureType: "WEIGHT",
  });
});
