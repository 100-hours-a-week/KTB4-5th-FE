import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { createRecommendationHandlers } from "./handlers";

const server = setupServer();
const root = "http://localhost:3000/api/v1/refrigerators/1";
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => server.use(...createRecommendationHandlers()));
afterAll(() => server.close());
function call(
  path: string,
  scenario = "READY",
  body?: unknown,
  extra: Record<string, string> = {},
) {
  return fetch(`${root}/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Cookie: `accessToken=test-user; XSRF-TOKEN=test-csrf; recommendationMock=${scenario}`,
      "X-XSRF-TOKEN": "test-csrf",
      "Content-Type": "application/json",
      ...extra,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

it.each(["READY", "STALE", "GENERATING", "EMPTY", "LIMIT_REACHED"])(
  "GET %s preserves quota and does not generate",
  async (status) => {
    const first = await (await call("recommendations", status)).json();
    const second = await (await call("recommendations", status)).json();
    expect(first.data.status).toBe(status);
    expect(second).toEqual(first);
    expect(first.data.recipes).toHaveLength(status === "EMPTY" ? 0 : 10);
  },
);

it("generates once, rejects a duplicate, and switches only on request", async () => {
  const first = await call("recommendation-jobs", "STALE", {
    mode: "INCLUDE_EXPIRED",
  });
  expect(first.status).toBe(202);
  const duplicate = await call("recommendation-jobs", "STALE", {});
  expect(duplicate.status).toBe(409);
  expect((await duplicate.json()).code).toBe("RECOMMEND-409-003");
  const generating = await (await call("recommendations", "STALE")).json();
  expect(generating.data.status).toBe("GENERATING");
  expect(generating.data.dailyGeneration.remaining).toBe(2);
  await new Promise((resolve) => setTimeout(resolve, 2_100));
  const finished = await (await call("recommendations", "STALE")).json();
  expect(finished.data.recommendationId).toBe("rec_001");
  expect(finished.data.hasNewRecommendation).toBe(true);
  expect((await call("recommendations/current", "STALE", {})).status).toBe(204);
  const ready = await (await call("recommendations", "STALE")).json();
  expect(ready.data.status).toBe("READY");
  expect(ready.data.recommendationId).not.toBe("rec_001");
  expect(ready.data.hasNewRecommendation).toBe(false);
  const latest = await call("recommendation-jobs", "STALE", {
    mode: "INCLUDE_EXPIRED",
  });
  expect(latest.status).toBe(200);
  expect((await latest.json()).data.dailyGeneration.remaining).toBe(2);
});

it("returns 429 without losing existing recommendations", async () => {
  expect((await call("recommendation-jobs", "LIMIT_REACHED", {})).status).toBe(
    429,
  );
  expect(
    (await (await call("recommendations", "LIMIT_REACHED")).json()).data
      .recipes,
  ).toHaveLength(10);
});

it("returns recommendations without requiring JavaScript access to HttpOnly cookies", async () => {
  const response = await fetch(`${root}/recommendations`);
  expect(response.status).toBe(200);
  expect((await response.json()).data.recipes).toHaveLength(10);
});

it("validates auth, CSRF, and mode", async () => {
  expect(
    (
      await fetch(`${root}/recommendations`, {
        headers: { Cookie: "recommendationMock=READY" },
      })
    ).status,
  ).toBe(401);
  expect(
    (
      await call(
        "recommendation-jobs",
        "STALE",
        {},
        { "X-XSRF-TOKEN": "wrong" },
      )
    ).status,
  ).toBe(403);
  expect(
    (await call("recommendation-jobs", "STALE", { mode: "invalid" })).status,
  ).toBe(400);
  expect(
    (await call("recommendation-jobs", "READY", { mode: "EXCLUDE_EXPIRED" }))
      .status,
  ).toBe(202);
});

it("applies once, accepts a 204 retry, rejects key reuse, and supports zero deductions", async () => {
  const body = { recommendationId: "rec_001", recipeId: "51" };
  const headers = { "Idempotency-Key": "same-cooking" };
  const first = await call("cooking-records", "READY", body, headers);
  expect(first.status).toBe(200);
  expect((await first.json()).data.useIngredients).toEqual([
    { ingredientId: "102", useAmount: 2, unit: "EA" },
    { ingredientId: "103", useAmount: 100, unit: "G" },
    { ingredientId: "104", useAmount: 1, unit: "EA" },
  ]);
  expect((await call("cooking-records", "READY", body, headers)).status).toBe(
    204,
  );
  expect(
    (
      await call(
        "cooking-records",
        "READY",
        { ...body, recipeId: "52" },
        headers,
      )
    ).status,
  ).toBe(409);
  for (const key of ["second", "third", "fourth"]) {
    const result = await call("cooking-records", "READY", body, {
      "Idempotency-Key": key,
    });
    expect(result.status).toBe(200);
    if (key === "fourth")
      expect((await result.json()).data.useIngredients).toEqual([]);
  }
});
