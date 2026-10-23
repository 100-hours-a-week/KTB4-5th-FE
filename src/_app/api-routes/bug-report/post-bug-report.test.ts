import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("./send-discord-bug-report", () => ({ sendDiscordBugReport: vi.fn() }));

const fields = {
  reporterName: "테스터",
  category: "BUG",
  description: "버그 제보",
};

function request(cookie = "accessToken=valid", body = JSON.stringify(fields)) {
  return new NextRequest("https://app.example/bug-reports", {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      "x-forwarded-for": "spoofed",
    },
    body,
  });
}

function me(userId: unknown = 42) {
  return Response.json({
    code: "USER-200-001",
    message: "OK",
    data: { userId },
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("BACKEND_ORIGIN", "https://backend.example");
  vi.stubEnv("DISCORD_BUG_REPORT_WEBHOOK_URL", "https://webhook.example");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it.each(["", "refreshToken=forged"])(
  "accessToken이 없으면 인증을 거절한다: %s",
  async (cookie) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { postBugReport } = await import("./post-bug-report");
    const { sendDiscordBugReport } = await import("./send-discord-bug-report");
    expect((await postBugReport(request(cookie))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendDiscordBugReport).not.toHaveBeenCalled();
  },
);

it.each([401, 403])(
  "위조 JWT의 sub를 바꿔도 백엔드가 %s이면 전송하지 않는다",
  async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status })),
    );
    const { postBugReport } = await import("./post-bug-report");
    const { sendDiscordBugReport } = await import("./send-discord-bug-report");
    for (let i = 0; i < 6; i += 1) {
      const payload = Buffer.from(
        JSON.stringify({ sub: `fake-${i}` }),
      ).toString("base64url");
      const response = await postBugReport(
        request(`accessToken=header.${payload}.fake`),
      );
      expect(response.status).toBe(401);
      expect(response.headers.get("Content-Type")).toBe(
        "application/problem+json",
      );
    }
    expect(sendDiscordBugReport).not.toHaveBeenCalled();
  },
);

it("검증된 백엔드 ID만 작성자와 제한 키로 사용하고 6번째 요청을 차단한다", async () => {
  const fetchMock = vi.fn(async () => me());
  vi.stubGlobal("fetch", fetchMock);
  const { postBugReport } = await import("./post-bug-report");
  const { sendDiscordBugReport } = await import("./send-discord-bug-report");
  for (let i = 0; i < 6; i += 1) {
    const response = await postBugReport(
      request(`accessToken=token-${i}; refreshToken=refresh`),
    );
    expect(response.status).toBe(i < 5 ? 201 : 429);
  }
  expect(sendDiscordBugReport).toHaveBeenCalledTimes(5);
  expect(sendDiscordBugReport).toHaveBeenLastCalledWith(
    "https://webhook.example",
    { ...fields, userId: "42" },
  );
  const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
  expect(url.toString()).toBe("https://backend.example/api/v1/users/me");
  expect(new Headers(init.headers).get("cookie")).toBe(
    "accessToken=token-0; refreshToken=refresh",
  );
  expect(init).toMatchObject({ cache: "no-store", redirect: "error" });
  expect(init.signal).toBeInstanceOf(AbortSignal);
});

it.each([null, "", {}, true])(
  "잘못된 인증 응답의 ID(%j)로는 전송하지 않는다",
  async (userId) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => me(userId)),
    );
    const { postBugReport } = await import("./post-bug-report");
    const { sendDiscordBugReport } = await import("./send-discord-bug-report");
    expect((await postBugReport(request())).status).toBe(503);
    expect(sendDiscordBugReport).not.toHaveBeenCalled();
  },
);

it.each(["network", "timeout", "500", "invalid-json"])(
  "인증 확인 장애(%s) 시 전송하지 않는다",
  async (failure) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (failure === "network") throw new TypeError("network failure");
        if (failure === "timeout")
          throw new DOMException("timeout", "TimeoutError");
        if (failure === "invalid-json") return new Response("invalid");
        return new Response(null, { status: 500 });
      }),
    );
    const { postBugReport } = await import("./post-bug-report");
    const { sendDiscordBugReport } = await import("./send-discord-bug-report");
    const response = await postBugReport(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "REPORT-503-002" });
    expect(sendDiscordBugReport).not.toHaveBeenCalled();
  },
);

it.each(["not json", JSON.stringify({ ...fields, description: "" })])(
  "기존 본문 검증을 유지한다: %s",
  async (body) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => me()),
    );
    const { postBugReport } = await import("./post-bug-report");
    const { sendDiscordBugReport } = await import("./send-discord-bug-report");
    expect(
      (await postBugReport(request("accessToken=valid", body))).status,
    ).toBe(400);
    expect(sendDiscordBugReport).not.toHaveBeenCalled();
  },
);
