import { afterAll, beforeAll, expect, it } from "vitest";

import { server } from "./server";

beforeAll(() => server.listen());
afterAll(() => server.close());

it("returns the mock health response", async () => {
  const response = await fetch("http://localhost:3000/api/v1/mock/health");

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    code: "MOCK-200-001",
    message: "OK",
    data: { status: "ok" },
  });
});
