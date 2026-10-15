import { afterEach, expect, it, vi } from "vitest";

import { proxyNotificationStream } from "./notification-stream";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("인증 쿠키를 전달하고 SSE 첫 이벤트를 압축 없이 스트리밍한다", async () => {
  vi.stubEnv("BACKEND_ORIGIN", "http://localhost:8080");
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response("event:connected\ndata:{}\n\n", {
        headers: { "Content-Type": "text/event-stream" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const response = await proxyNotificationStream(
    new Request(
      "http://localhost:3000/api/v2/refrigerators/5/notifications/stream",
      {
        headers: { Cookie: "accessToken=test-token" },
      },
    ),
    "5",
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("text/event-stream");
  expect(response.headers.get("cache-control")).toBe("no-store, no-transform");
  expect(await response.text()).toBe("event:connected\ndata:{}\n\n");
  const [url, init] = fetchMock.mock.calls[0]!;
  expect(url.toString()).toBe(
    "http://localhost:8080/api/v2/refrigerators/5/notifications/stream",
  );
  expect(new Headers(init?.headers).get("cookie")).toBe(
    "accessToken=test-token",
  );
});

it("인증 실패 상태와 서버 쿠키를 그대로 돌려준다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        { code: "GLOBAL-401-001", message: "로그인이 필요합니다." },
        { status: 401, headers: { "Set-Cookie": "XSRF-TOKEN=test; Path=/" } },
      ),
    ),
  );

  const response = await proxyNotificationStream(
    new Request(
      "http://localhost:3000/api/v2/refrigerators/5/notifications/stream",
    ),
    "5",
  );

  expect(response.status).toBe(401);
  expect(response.headers.get("set-cookie")).toBe("XSRF-TOKEN=test; Path=/");
  expect(await response.json()).toEqual({
    code: "GLOBAL-401-001",
    message: "로그인이 필요합니다.",
  });
});
