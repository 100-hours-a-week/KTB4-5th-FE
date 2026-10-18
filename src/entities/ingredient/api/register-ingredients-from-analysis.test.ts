import { afterEach, expect, it, vi } from "vitest";

import { registerIngredientsFromAnalysis } from "./register-ingredients-from-analysis";

afterEach(() => vi.unstubAllGlobals());

it("posts the analysis body to the dedicated endpoint and unwraps the response", async () => {
  const data = {
    createdCount: 1,
    mergedCount: 0,
    ingredientsNum: 1,
    refrigeratorCapacity: 100,
    mergedItems: [],
  };
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(
        JSON.stringify({ code: "INGREDIENT-201-001", message: "성공", data }),
        { status: 201 },
      ),
    );
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=token" });
  const body = {
    analysisId: "analysis-id",
    images: [
      {
        imageObjectKey: "a.jpg",
        items: [
          {
            itemId: "a1",
            name: "우유",
            category: "OTHER" as const,
            storageType: "REFRIGERATED" as const,
            measureType: "COUNT" as const,
            quantity: 1,
            weight: null,
            expiration: "2026-10-20",
          },
        ],
      },
    ],
  };
  await expect(
    registerIngredientsFromAnalysis({ refrigeratorId: "fridge/1", body }),
  ).resolves.toEqual(data);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/refrigerators/fridge%2F1/ingredients/from-analysis",
    expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
  );
});
