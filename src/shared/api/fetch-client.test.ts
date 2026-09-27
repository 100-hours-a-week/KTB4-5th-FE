import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiRequestOptions } from "./fetch-client";

const ok = () =>
  new Response(
    JSON.stringify({ code: "TEST-200-001", message: "OK", data: null }),
    {
      status: 200,
    },
  );
const csrfIssued = () => new Response(null, { status: 204 });
const csrfRejected = () =>
  new Response(
    JSON.stringify({ title: "CSRF 토큰 오류", code: "COMMON-403-CSRF-001" }),
    { status: 403 },
  );

function cookie(token: string) {
  document.cookie = `XSRF-TOKEN=${token}`;
}

async function request(path: string, options: ApiRequestOptions = {}) {
  const { requestJson } = await import("./fetch-client");
  return requestJson<null>(path, options);
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  vi.stubGlobal("document", { cookie: "" });
});

describe("CSRF API integration", () => {
  it("issues a missing token before a mutation and sends the cookie value", async () => {
    const fetchMock = vi.fn(async (input: string, init: RequestInit) => {
      if (input === "/api/v1/auth/csrf") {
        expect(init.method).toBe("GET");
        cookie("issued-token");
        return csrfIssued();
      }

      expect(input).toBe("/api/v1/items");
      expect(init.credentials).toBe("include");
      expect(new Headers(init.headers).get("X-XSRF-TOKEN")).toBe(
        "issued-token",
      );
      return ok();
    });
    vi.stubGlobal("fetch", fetchMock);

    await request("/items", { method: "POST", json: { name: "우유" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refreshes on the CSRF error code and retries only once with a new header", async () => {
    cookie("stale-token");
    const headers: string[] = [];
    const fetchMock = vi.fn(async (input: string, init: RequestInit) => {
      if (input === "/api/v1/auth/csrf") {
        cookie("new-token");
        return csrfIssued();
      }
      headers.push(new Headers(init.headers).get("X-XSRF-TOKEN") ?? "");
      return csrfRejected();
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("/items", { method: "DELETE" })).rejects.toMatchObject(
      {
        code: "COMMON-403-CSRF-001",
      },
    );
    expect(headers).toEqual(["stale-token", "new-token"]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry an unrelated 403", async () => {
    cookie("token");
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ title: "권한 부족", code: "AUTH-403-001" }),
          {
            status: 403,
          },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("/items", { method: "PATCH" })).rejects.toMatchObject({
      code: "AUTH-403-001",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("turns a failed 401 renewal into the global session-expired error", async () => {
    cookie("member-token");
    const fetchMock = vi.fn(async (input: string) => {
      if (input === "/api/v1/auth/token-renewals") {
        return new Response(null, { status: 401 });
      }

      return new Response(
        JSON.stringify({ title: "로그인 필요", code: "AUTH-401-001" }),
        { status: 401 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("/items", { method: "POST" })).rejects.toMatchObject({
      name: "SessionExpiredError",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps GET and read-only nickname validation free of CSRF headers", async () => {
    const fetchMock = vi.fn(async (_input: string, init: RequestInit) => {
      expect(new Headers(init.headers).has("X-XSRF-TOKEN")).toBe(false);
      return ok();
    });
    vi.stubGlobal("fetch", fetchMock);

    await request("/items");
    await request("/users/nickname-validations", { method: "POST" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("renews CSRF after login before the next mutation", async () => {
    cookie("anonymous-token");
    const headers: string[] = [];
    const fetchMock = vi.fn(async (input: string, init: RequestInit) => {
      if (input === "/api/v1/auth/csrf") {
        cookie("member-token");
        return csrfIssued();
      }
      headers.push(new Headers(init.headers).get("X-XSRF-TOKEN") ?? "");
      return ok();
    });
    vi.stubGlobal("fetch", fetchMock);

    await request("/auth/sessions", { method: "POST", json: {} });
    await request("/items", { method: "POST", json: {} });
    expect(headers).toEqual(["anonymous-token", "member-token"]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not send a mutation if token issuance fails", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ title: "서버 오류", code: "AUTH-500-000" }),
          {
            status: 500,
          },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("/items", { method: "POST" })).rejects.toMatchObject({
      code: "AUTH-500-000",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not send a mutation when issuance returns 204 without a cookie", async () => {
    const fetchMock = vi.fn(async () => csrfIssued());
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("/items", { method: "POST" })).rejects.toThrow(
      "CSRF 토큰 쿠키가 발급되지 않았습니다.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tries issuance again after a successful login followed by a failed renewal", async () => {
    cookie("anonymous-token");
    let issuanceCount = 0;
    const fetchMock = vi.fn(async (input: string, init: RequestInit) => {
      if (input === "/api/v1/auth/csrf") {
        issuanceCount += 1;
        if (issuanceCount === 1) {
          return new Response(null, { status: 500 });
        }
        cookie("member-token");
        return csrfIssued();
      }
      if (input === "/api/v1/items") {
        expect(new Headers(init.headers).get("X-XSRF-TOKEN")).toBe(
          "member-token",
        );
      }
      return ok();
    });
    vi.stubGlobal("fetch", fetchMock);

    await request("/auth/sessions", { method: "POST" });
    await request("/items", { method: "POST" });
    expect(issuanceCount).toBe(2);
  });

  it("shares one issuance request while several mutations wait", async () => {
    const fetchMock = vi.fn(async (input: string) => {
      if (input === "/api/v1/auth/csrf") {
        await Promise.resolve();
        cookie("shared-token");
        return csrfIssued();
      }
      return ok();
    });
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([
      request("/items", { method: "POST" }),
      request("/items", { method: "DELETE" }),
    ]);
    expect(
      fetchMock.mock.calls.filter(([input]) => input === "/api/v1/auth/csrf"),
    ).toHaveLength(1);
  });
});
