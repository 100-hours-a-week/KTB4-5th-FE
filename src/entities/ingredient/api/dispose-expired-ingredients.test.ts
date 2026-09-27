import { afterEach, expect, it, vi } from "vitest";

import { disposeExpiredIngredients } from "./dispose-expired-ingredients";

afterEach(() => vi.unstubAllGlobals());

it("posts the selected ingredient ids and accepts an empty 204 response", async () => {
  const fetchMock = vi.fn(async (_url: string, options: RequestInit) => {
    expect(options.method).toBe("POST");
    expect(new Headers(options.headers).get("Content-Type")).toBe(
      "application/json",
    );
    expect(new Headers(options.headers).get("X-XSRF-TOKEN")).toBe("csrf-token");
    expect(options.body).toBe(
      JSON.stringify({ ingredientIds: [12, 305, 4081] }),
    );
    expect(options.credentials).toBe("include");

    return new Response(null, { status: 204 });
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=csrf-token" });

  await expect(
    disposeExpiredIngredients({
      refrigeratorId: "refrigerator 1",
      ingredientIds: ["12", "305", "4081"],
    }),
  ).resolves.toBeUndefined();
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/refrigerators/refrigerator%201/ingredients/expired",
    expect.any(Object),
  );
});
