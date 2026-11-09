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

  it.each(["network", "503", "timeout"])(
    "keeps a temporary %s renewal failure separate from session expiry",
    async (failure) => {
      cookie("member-token");
      const fetchMock = vi.fn(async (input: string) => {
        if (input.endsWith("/auth/token-renewals")) {
          if (failure === "network") throw new TypeError("Failed to fetch");
          if (failure === "timeout")
            throw new DOMException("Timed out", "TimeoutError");
          return new Response(null, { status: 503 });
        }
        return new Response(null, { status: 401 });
      });
      vi.stubGlobal("fetch", fetchMock);

      await expect(request("/items")).rejects.toMatchObject({
        name: "Error",
        message: "로그인 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );

  it.each([200, 401])(
    "retries the original request only once after renewal: %s",
    async (status) => {
      cookie("member-token");
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 401 }))
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(
          status === 200 ? ok() : new Response(null, { status: 401 }),
        );
      vi.stubGlobal("fetch", fetchMock);

      if (status === 200) {
        await expect(request("/items")).resolves.toMatchObject({ data: null });
      } else {
        await expect(request("/items")).rejects.toMatchObject({
          name: "SessionExpiredError",
        });
      }
      expect(fetchMock.mock.calls.map(([input]) => input)).toEqual([
        "/api/v1/items",
        "/api/v1/auth/token-renewals",
        "/api/v1/items",
      ]);
    },
  );

  it("keeps GET requests free of CSRF headers", async () => {
    const fetchMock = vi.fn(async (_input: string, init: RequestInit) => {
      expect(new Headers(init.headers).has("X-XSRF-TOKEN")).toBe(false);
      return ok();
    });
    vi.stubGlobal("fetch", fetchMock);

    await request("/items");
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
