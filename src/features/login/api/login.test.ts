import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=before-login" });
});

describe("login API", () => {
  it("sends only credentials with CSRF protection and reads refrigerator ids", async () => {
    const fetchMock = vi.fn(async (input: string, init: RequestInit) => {
      if (input === "/api/v1/auth/csrf") {
        document.cookie = "XSRF-TOKEN=after-login";
        return new Response(null, { status: 204 });
      }

      expect(input).toBe("/api/v1/auth/sessions");
      expect(init.method).toBe("POST");
      expect(init.credentials).toBe("include");
      expect(new Headers(init.headers).get("X-XSRF-TOKEN")).toBe(
        "before-login",
      );
      expect(JSON.parse(init.body as string)).toEqual({
        loginId: "member",
        password: "password123",
      });

      return new Response(
        JSON.stringify({
          code: "AUTH-200-002",
          message: "OK",
          data: { activeRefrigeratorIds: ["fridge-1"] },
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const { login } = await import("./login");
    const response = await login({
      loginId: "member",
      password: "password123",
    });

    expect(response.data.activeRefrigeratorIds).toEqual(["fridge-1"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(document.cookie).toBe("XSRF-TOKEN=after-login");
  });

  it("rejects a malformed refrigerator list", async () => {
    const fetchMock = vi.fn(async (input: string) =>
      input === "/api/v1/auth/csrf"
        ? new Response(null, { status: 204 })
        : new Response(
            JSON.stringify({
              code: "AUTH-200-002",
              message: "OK",
              data: { activeRefrigeratorIds: null },
            }),
            { status: 200 },
          ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { login } = await import("./login");
    await expect(
      login({ loginId: "member", password: "password123" }),
    ).rejects.toThrow("로그인 응답의 냉장고 목록 형식이 올바르지 않습니다.");
  });
});
