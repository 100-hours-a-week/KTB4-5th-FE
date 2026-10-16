// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import {
  imageAnalysisQueries,
  useRegisteredAnalyses,
  type ImageAnalysisList,
} from "@/entities/image";
import { analysisFixture } from "@/entities/image/api/image-analysis.test-fixtures";
import { toRecognitionResult } from "./receipt-recognition";
import { useReceiptResultForm } from "./use-receipt-result-form";

vi.mock("@lineiconshq/free-icons", () => ({ CalendarDaysOutlined: {} }));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));
vi.mock("@/entities/refrigerator", () => ({
  useCurrentRefrigeratorId: () => "17",
}));
vi.mock("@/entities/notification", () => ({
  useNotificationSessionScope: () => "session",
}));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast: vi.fn() }));

let queryClient: QueryClient;
const fetchMock = vi.fn();
const listKey = imageAnalysisQueries.list("session").queryKey;
const recognition = toRecognitionResult(analysisFixture);
recognition.drafts[0].expirationDate = "2026-10-20";

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  queryClient.setQueryData(listKey, { analyses: [analysisFixture] });
  useRegisteredAnalyses.setState({ idsBySession: {} });
  document.cookie = "XSRF-TOKEN=test-token; path=/";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  document.cookie = "XSRF-TOKEN=; Max-Age=0; path=/";
  vi.unstubAllGlobals();
});
function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

it("등록 API 성공 뒤에만 작업을 숨기고 분석 목록을 제거·무효화한다", async () => {
  let complete!: (response: Response) => void;
  fetchMock.mockImplementation(
    () =>
      new Promise<Response>((resolve) => {
        complete = resolve;
      }),
  );
  const { result } = renderHook(() => useReceiptResultForm(recognition), {
    wrapper,
  });
  await act(async () => {
    await result.current.submit();
  });
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(fetchMock.mock.calls[0][0]).toBe(
    "/api/v1/refrigerators/17/ingredients/from-analysis",
  );
  expect(useRegisteredAnalyses.getState().idsBySession).toEqual({});
  expect(
    queryClient.getQueryData<ImageAnalysisList>(listKey)?.analyses,
  ).toHaveLength(1);
  const registered = {
    createdCount: 1,
    mergedCount: 0,
    ingredientsNum: 1,
    refrigeratorCapacity: 100,
    mergedItems: [],
  };
  await act(async () =>
    complete(
      Response.json({
        code: "INGREDIENT-201-001",
        message: "등록 성공",
        data: registered,
      }),
    ),
  );
  await waitFor(() =>
    expect(result.current.completedResult).toEqual(registered),
  );
  expect(useRegisteredAnalyses.getState().idsBySession.session).toEqual([
    analysisFixture.analysisId,
  ]);
  expect(queryClient.getQueryData(listKey)).toEqual({ analyses: [] });
  expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
});

it("등록 실패 시 배너 대상과 입력값을 유지하고 완료로 표시하지 않는다", async () => {
  fetchMock.mockResolvedValue(
    Response.json(
      { title: "등록 실패", status: 500, code: "INGREDIENT-500-001" },
      { status: 500 },
    ),
  );
  const { result } = renderHook(() => useReceiptResultForm(recognition), {
    wrapper,
  });
  await act(async () => {
    await result.current.submit();
  });
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(result.current.isRegistering).toBe(false));
  expect(result.current.completedResult).toBeNull();
  expect(useRegisteredAnalyses.getState().idsBySession).toEqual({});
  expect(
    queryClient.getQueryData<ImageAnalysisList>(listKey)?.analyses,
  ).toEqual([analysisFixture]);
  expect(result.current.form.getValues("drafts")).toEqual(recognition.drafts);
});
