import { afterEach, expect, it, vi } from "vitest";

import { getMe } from "./get-me";

afterEach(() => vi.unstubAllGlobals());

it.each([0, 3])(
  "preserves cookingCount %s from the profile response",
  async (cookingCount) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          code: "USER-200-001",
          message: "OK",
          data: { userId: 1, nickname: "요리사", cookingCount },
        }),
      ),
    );

    expect(await getMe()).toEqual({
      userId: "1",
      nickname: "요리사",
      email: null,
      profileImageUrl: null,
      cookingCount,
    });
  },
);
