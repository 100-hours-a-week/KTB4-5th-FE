import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api";

const reportOperationFailure = vi.hoisted(() => vi.fn());

vi.mock("@/_app/monitoring/index.client", () => ({ reportOperationFailure }));
vi.mock("@/_app/providers/session-expiry", () => ({ expireSession: vi.fn() }));

import { createQueryClient } from "./query-provider";

afterEach(() => vi.clearAllMocks());

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
