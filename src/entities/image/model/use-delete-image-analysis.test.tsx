// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api";

import { analysisFixture } from "../api/image-analysis.test-fixtures";
import { imageAnalysisQueries } from "../api/image-analysis.queries";
import { useDeleteImageAnalysis } from "./use-delete-image-analysis";

const { remove, get } = vi.hoisted(() => ({ remove: vi.fn(), get: vi.fn() }));
vi.mock("../api/delete-image-analysis", () => ({
  deleteImageAnalysis: remove,
}));
vi.mock("../api/get-image-analysis", () => ({ getImageAnalysis: get }));

let client: QueryClient;
const detail = imageAnalysisQueries.detail(analysisFixture.analysisId);
const other = imageAnalysisQueries.detail("other-analysis");
const list = imageAnalysisQueries.list("session");

beforeEach(() => {
  client = new QueryClient();
  client.setQueryData(detail.queryKey, analysisFixture);
  client.setQueryData(other.queryKey, {
    ...analysisFixture,
    analysisId: "other-analysis",
  });
  client.setQueryData(list.queryKey, { analyses: [analysisFixture] });
  remove.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.resetAllMocks();
});

function openDelete() {
  return renderHook(() => useDeleteImageAnalysis(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

it("deletes the matching detail and rechecks the server instead of restoring a removed result", async () => {
  const { result } = openDelete();
  await act(() => result.current.mutateAsync(analysisFixture.analysisId));

  expect(client.getQueryData(detail.queryKey)).toBeUndefined();
  expect(client.getQueryData(other.queryKey)?.analysisId).toBe(
    "other-analysis",
  );
  expect(client.getQueryState(list.queryKey)?.isInvalidated).toBe(true);

  const notFound = new ApiError(404, {
    code: "IMAGE-404-001",
    title: "분석 결과가 없습니다",
  });
  get.mockRejectedValue(notFound);
  await expect(client.fetchQuery(detail)).rejects.toBe(notFound);
  expect(get).toHaveBeenCalledWith({
    analysisId: analysisFixture.analysisId,
    signal: expect.any(AbortSignal),
  });
});

it("keeps the detail and list intact when deletion fails", async () => {
  const error = new Error("offline");
  remove.mockRejectedValue(error);
  const { result } = openDelete();
  await act(async () => {
    await expect(
      result.current.mutateAsync(analysisFixture.analysisId),
    ).rejects.toBe(error);
  });

  expect(client.getQueryData(detail.queryKey)).toEqual(analysisFixture);
  expect(client.getQueryState(list.queryKey)?.isInvalidated).toBe(false);
});
