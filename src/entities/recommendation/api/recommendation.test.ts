import { afterEach, expect, it, vi } from "vitest";
import { applyRecipe } from "./recommendation";

afterEach(() => vi.unstubAllGlobals());
it.each([200, 204])(
  "accepts cooking %s with CSRF and the caller's idempotency key",
  async (status) => {
    vi.stubGlobal("document", { cookie: "XSRF-TOKEN=test-csrf" });
    const fetchMock = vi.fn(async () =>
      status === 204
        ? new Response(null, { status })
        : Response.json({
            code: "RECOMMEND-200-004",
            message: "OK",
            data: { recipeId: "51", useIngredients: [] },
          }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await applyRecipe(
      "1",
      { recommendationId: "rec_001", recipeId: "51" },
      "same-key",
    );
    const [path, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(path).toBe("/api/v1/refrigerators/1/cooking-records");
    expect(new Headers(init.headers).get("Idempotency-Key")).toBe("same-key");
    expect(new Headers(init.headers).get("X-XSRF-TOKEN")).toBe("test-csrf");
    expect(JSON.parse(String(init.body))).toEqual({
      recommendationId: "rec_001",
      recipeId: "51",
    });
  },
);
