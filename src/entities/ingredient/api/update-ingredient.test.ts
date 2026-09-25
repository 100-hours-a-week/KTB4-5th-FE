import { afterEach, expect, it, vi } from "vitest";

import { updateIngredient } from "./update-ingredient";

afterEach(() => vi.unstubAllGlobals());

it("sends PATCH with the detail ETag and parses the new ETag", async () => {
  const fetchMock = vi.fn(async (_url: string, options: RequestInit) => {
    expect(options.method).toBe("PATCH");
    expect(new Headers(options.headers).get("If-Match")).toBe('"sha256-old"');
    expect(new Headers(options.headers).get("X-XSRF-TOKEN")).toBe("csrf-token");
    expect(options.body).toBe(JSON.stringify({ quantity: 7 }));
    expect(options.credentials).toBe("include");
    return new Response(
      JSON.stringify({
        code: "INGREDIENT-200-004",
        message: "재고 수정 성공",
        data: {
          ingredientId: "1",
          name: "두부",
          category: "TOFU_BEAN",
          storageType: "REFRIGERATED",
          measureType: "WEIGHT",
          quantity: null,
          weightValue: "550.000",
          weightUnit: "G",
          expirationDate: "2026-09-15",
          createdDate: "2026-09-01",
          registrationSource: "DIRECT",
          status: "EXPIRED",
          daysUntilExpiration: -1,
          mergedItems: [
            {
              ingredientId: 1,
              name: "두부",
              measureType: "WEIGHT",
              previousQuantity: null,
              addedQuantity: null,
              totalQuantity: null,
              previousWeightValue: 250,
              addedWeightValue: "300.000",
              totalWeightValue: 550,
              weightUnit: "G",
            },
          ],
        },
      }),
      { status: 200, headers: { ETag: '"sha256-new"' } },
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=csrf-token" });

  const result = await updateIngredient({
    ingredientId: "1",
    etag: '"sha256-old"',
    body: { quantity: 7 },
  });
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/ingredients/1",
    expect.any(Object),
  );
  expect(result.etag).toBe('"sha256-new"');
  expect(result.ingredient).toMatchObject({
    ingredientId: "1",
    registrationSource: "DIRECT",
    weightValue: 550,
  });
  expect(result.ingredient).not.toHaveProperty("mergedItems");
  expect(result.mergedItems).toEqual([
    expect.objectContaining({
      ingredientId: 1,
      previousWeightValue: 250,
      addedWeightValue: 300,
      totalWeightValue: 550,
    }),
  ]);
});
