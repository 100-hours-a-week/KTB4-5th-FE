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

it("updates only the requested notification preference and returns the saved settings", async () => {
  const url = "http://localhost:3000/api/v1/notifications";
  const response = await fetch(`${url}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      notificationPreferences: [{ type: "EXPIRATION", isEnabled: false }],
    }),
  });

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    code: "NOTI-200-002",
    data: {
      notificationPreferences: [
        { type: "EXPIRATION", isEnabled: false },
        { type: "RECIPE", isEnabled: true },
      ],
    },
  });
  expect(await (await fetch(`${url}/settings`)).json()).toMatchObject({
    code: "NOTI-200-001",
    data: {
      notificationPreferences: [
        { type: "EXPIRATION", isEnabled: false },
        { type: "RECIPE", isEnabled: true },
      ],
    },
  });
});
