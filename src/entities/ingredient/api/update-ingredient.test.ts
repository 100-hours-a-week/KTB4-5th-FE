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
        data: { ingredientId: "1", weightValue: null },
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
});
