import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, requestJson } from "@/shared/api";

const { reportOperationFailure, expireSession } = vi.hoisted(() => ({
  reportOperationFailure: vi.fn(),
  expireSession: vi.fn(),
}));

vi.mock("@/_app/monitoring/index.client", () => ({ reportOperationFailure }));
vi.mock("@/_app/providers/session-expiry", () => ({ expireSession }));

import { createQueryClient } from "./query-provider";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

it.each(["network", "503", "timeout"])(
  "keeps cached data and allows recovery after a %s renewal failure",
  async (failure) => {
    vi.stubGlobal("document", { cookie: "XSRF-TOKEN=test" });
    let available = false;
    let authorized = false;
    const fetchMock = vi.fn(async (input: string) => {
      if (input.endsWith("/auth/token-renewals")) {
        if (!available) {
          if (failure === "network") throw new TypeError("Failed to fetch");
          if (failure === "timeout")
            throw new DOMException("Timed out", "TimeoutError");
          return new Response(null, { status: 503 });
        }
        authorized = true;
        return new Response(null, { status: 204 });
      }
      return authorized
        ? new Response(
            JSON.stringify({ code: "TEST-200-001", message: "OK", data: null }),
          )
        : new Response(null, { status: 401 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = createQueryClient();
    client.setQueryData(["existing-data"], "keep");
    const options = {
      queryKey: ["items"],
      queryFn: () => requestJson("/items"),
      retryDelay: 0,
    };

    try {
      await expect(client.fetchQuery(options)).rejects.toMatchObject({
        name: "Error",
      });
      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(expireSession).not.toHaveBeenCalled();
      expect(client.getQueryData(["existing-data"])).toBe("keep");

      available = true;
      await expect(client.fetchQuery(options)).resolves.toMatchObject({
        data: null,
      });
      expect(fetchMock).toHaveBeenCalledTimes(7);
      expect(expireSession).not.toHaveBeenCalled();
    } finally {
      client.clear();
    }
  },
);

it("does not repeat a mutation or expire the session when renewal is unavailable", async () => {
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=test" });
  const fetchMock = vi.fn(
    async (input: string) =>
      new Response(null, {
        status: input.endsWith("/auth/token-renewals") ? 503 : 401,
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const client = createQueryClient();
  client.setQueryData(["existing-data"], "keep");
  const mutation = client.getMutationCache().build(client, {
    mutationFn: () =>
      requestJson("/items", { method: "POST", json: { name: "우유" } }),
  });

  try {
    await expect(mutation.execute(undefined)).rejects.toMatchObject({
      name: "Error",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(expireSession).not.toHaveBeenCalled();
    expect(client.getQueryData(["existing-data"])).toBe("keep");
  } finally {
    client.clear();
  }
});

it("still expires the session when renewal is rejected with 401", async () => {
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=test" });
  const fetchMock = vi.fn(async () => new Response(null, { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);
  const client = createQueryClient();
  try {
    await expect(
      client.fetchQuery({
        queryKey: ["items"],
        queryFn: () => requestJson("/items"),
        retryDelay: 0,
      }),
    ).rejects.toMatchObject({ name: "SessionExpiredError" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(expireSession).toHaveBeenCalledExactlyOnceWith(client);
  } finally {
    client.clear();
  }
});

describe("Query 캐시의 최종 실패", () => {
  it("조회 재시도 종료 후 한 번만 보고한다", async () => {
    const client = createQueryClient();
    const error = new ApiError(503, {
      code: "INGREDIENT-503-001",
      title: "서버 오류",
    });
    const queryFn = vi.fn().mockRejectedValue(error);
    const meta = { monitoringOperation: "ingredient.list" };

    await expect(
      client.fetchQuery({
        queryKey: ["refrigerators", "private-id", "ingredients"],
        queryFn,
        meta,
        retry: 1,
      }),
    ).rejects.toBe(error);

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(reportOperationFailure).toHaveBeenCalledExactlyOnceWith(error, meta);
    client.clear();
  });

  it("등록 mutation의 실패도 같은 경로로 보고한다", async () => {
    const client = createQueryClient();
    const error = new ApiError(503, {
      code: "INGREDIENT-503-001",
      title: "서버 오류",
    });
    const meta = { monitoringOperation: "ingredient.register" };
    const mutation = client.getMutationCache().build(client, {
      mutationFn: vi.fn().mockRejectedValue(error),
      meta,
    });

    await expect(mutation.execute(undefined)).rejects.toBe(error);

    expect(reportOperationFailure).toHaveBeenCalledExactlyOnceWith(error, meta);
    client.clear();
  });
});
