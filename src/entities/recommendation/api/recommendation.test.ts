import { afterEach, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api";
import {
  applyRecipe,
  getRecipeDetail,
  createRecommendationJob,
  getRecommendations,
} from "./recommendation";

const recipeFixture = {
  recipeId: "RDA:51",
  name: "두부김치",
  imageUrl: null,
  cookingTimeMinutes: null,
  targetServings: 2,
  expiringIngredientCount: null,
  ingredients: [],
  steps: [],
};

afterEach(() => vi.unstubAllGlobals());
it.each([200, 204])(
  "accepts cooking %s with CSRF and the caller's idempotency key",
  async (status) => {
    vi.stubGlobal("document", { cookie: "XSRF-TOKEN=test-csrf" });
    const fetchMock = vi.fn<
      (path: string, init: RequestInit) => Promise<Response>
    >(async () =>
      status === 204
        ? new Response(null, { status })
        : Response.json({
            code: "RECOMMEND-200-004",
            message: "OK",
            data: { recipeId: "RDA:51", useIngredients: [] },
          }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await applyRecipe(
      "1",
      { recommendationId: "123", recipeId: "RDA:51" },
      "same-key",
      `"${"a".repeat(64)}"`,
    );
    const [path, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(path).toBe("/api/v1/refrigerators/1/cooking-records");
    expect(new Headers(init.headers).get("Idempotency-Key")).toBe("same-key");
    expect(new Headers(init.headers).get("If-Match")).toBe(
      `"${"a".repeat(64)}"`,
    );
    expect(new Headers(init.headers).get("X-XSRF-TOKEN")).toBe("test-csrf");
    expect(JSON.parse(String(init.body))).toEqual({
      recommendationId: "123",
      recipeId: "RDA:51",
    });
  },
);

it("reads the detail ETag and encodes the backend recipe ID", async () => {
  const etag = `"${"a".repeat(64)}"`;
  const recipe = recipeFixture;
  const fetchMock = vi.fn<
    (path: string, init: RequestInit) => Promise<Response>
  >(async () =>
    Response.json(
      { code: "RECOMMEND-200-002", message: "OK", data: recipe },
      { headers: { ETag: etag } },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  await expect(getRecipeDetail("1", "RDA:51")).resolves.toEqual({
    ...recipe,
    etag,
  });
  expect(fetchMock.mock.calls[0]?.[0]).toBe(
    "/api/v1/refrigerators/1/recipes/RDA%3A51",
  );
});
it.each([null, 'W/"old"'])(
  "rejects a missing or unusable detail ETag: %s",
  async (etag) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            code: "RECOMMEND-200-002",
            message: "OK",
            data: recipeFixture,
          },
          { headers: etag ? { ETag: etag } : {} },
        ),
      ),
    );
    await expect(getRecipeDetail("1", "RDA:51")).rejects.toThrow();
  },
);
it("leaves the mode to the backend default and sends the taste DTO directly", async () => {
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=test-csrf" });
  const fetchMock = vi.fn<
    (path: string, init: RequestInit) => Promise<Response>
  >(async () =>
    Response.json(
      {
        code: "RECOMMEND-202-001",
        message: "OK",
        data: {
          jobId: "job",
          status: "QUEUED",
          mode: "EXCLUDE_EXPIRED",
          pollAfterMs: 1000,
          dailyGeneration: {
            limit: 10,
            remaining: 9,
            resetAt: "2026-11-02T00:00:00+09:00",
          },
        },
      },
      { status: 202 },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  await createRecommendationJob("1", {
    preferenceTags: ["한식"],
    targetServings: 2,
  });
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1].body))).toEqual({
    preferenceTags: ["한식"],
    targetServings: 2,
  });
});
it("accepts unknown ingredient counts without discarding the real list", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        code: "RECOMMEND-200-001",
        message: "OK",
        data: {
          recommendationId: "123",
          status: "READY",
          generatedAt: null,
          activeJobId: null,
          dailyGeneration: {
            limit: 10,
            remaining: 0,
            resetAt: "2026-11-02T00:00:00+09:00",
          },
          recipes: [
            {
              recipeId: "RDA:51",
              name: "요리",
              imageUrl: null,
              cookingTimeMinutes: null,
              ingredientCounts: { total: null, owned: null, expiring: null },
            },
          ],
        },
      }),
    ),
  );
  await expect(getRecommendations("1")).resolves.toMatchObject({
    status: "READY",
    dailyGeneration: { remaining: 0 },
    recipes: [{ ingredientCounts: { total: null } }],
  });
});
it("preserves the backend precondition failure for the page recovery flow", async () => {
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=test-csrf" });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        { status: 412, code: "RECOMMEND-412-001" },
        { status: 412 },
      ),
    ),
  );
  await expect(
    applyRecipe(
      "1",
      { recommendationId: "123", recipeId: "RDA:51" },
      "key",
      `"${"a".repeat(64)}"`,
    ),
  ).rejects.toBeInstanceOf(ApiError);
});
