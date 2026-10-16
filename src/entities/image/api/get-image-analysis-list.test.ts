import { afterEach, expect, it, vi } from "vitest";

import { getImageAnalysisList } from "./get-image-analysis-list";
import { analysisFixture } from "./image-analysis.test-fixtures";
import { imageAnalysisQueries } from "./image-analysis.queries";

afterEach(() => vi.unstubAllGlobals());

it.each([
  { analyses: [] },
  { analyses: [analysisFixture] },
  {
    analyses: [
      {
        ...analysisFixture,
        status: "PROCESSING",
        expiresAt: null,
        pollAfterMs: 1000,
      },
    ],
  },
])(
  "unwraps the user's retained jobs without losing results or null expiry",
  async ({ analyses }) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "IMAGE-200-004",
          message: "성공",
          data: { analyses },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;
    await expect(getImageAnalysisList({ signal })).resolves.toEqual({
      analyses,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/image-analyses",
      expect.objectContaining({ signal }),
    );
  },
);

it("isolates list caches by session and from detail caches", () => {
  expect(imageAnalysisQueries.list("a").queryKey).not.toEqual(
    imageAnalysisQueries.list("b").queryKey,
  );
  expect(imageAnalysisQueries.list("a").queryKey).not.toEqual(
    imageAnalysisQueries.detail("a").queryKey,
  );
});
