import { afterAll, beforeAll, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

const server = setupServer(
  ...handlers,
  http.all(
    "http://localhost/api/v1/refrigerators/1/*",
    () => new HttpResponse(null, { status: 418 }),
  ),
);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
it.each([
  "recommendations",
  "recommendation-jobs",
  "recommendations/current",
  "recipes/RDA%3A51",
  "cooking-records",
])(
  "runtime MSW leaves %s to the backend even with old scenario cookies",
  async (path) => {
    const response = await fetch(
      `http://localhost/api/v1/refrigerators/1/${path}`,
      {
        method: [
          "recommendation-jobs",
          "recommendations/current",
          "cooking-records",
        ].includes(path)
          ? "POST"
          : "GET",
        headers: { Cookie: "recommendationMock=READY" },
      },
    );
    expect(response.status).toBe(418);
  },
);

it("returns the mock health response", async () => {
  const response = await fetch("http://localhost:3000/api/v1/mock/health");

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    code: "MOCK-200-001",
    message: "OK",
    data: { status: "ok" },
  });
});
