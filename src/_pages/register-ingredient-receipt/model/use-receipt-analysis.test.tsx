// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api";
import { showAppToast } from "@/shared/ui/app-toast";

import { useReceiptAnalysis } from "./use-receipt-analysis";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  submit: vi.fn(),
  get: vi.fn(),
  list: vi.fn(() => ({ analyses: [] })),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/entities/image", () => ({
  uploadImage: mocks.upload,
  requestImageAnalysis: mocks.submit,
  useDeleteImageAnalysis: () => ({ mutate: vi.fn(), isPending: false }),
  useRegisteredAnalyses: (select: (state: object) => unknown) =>
    select({ idsBySession: {} }),
  imageAnalysisQueries: {
    lists: () => ["image-analyses", "list"],
    list: (scope: string) => ({
      queryKey: ["image-analyses", "list", scope],
      queryFn: mocks.list,
    }),
    detail: (id: string) => ({
      queryKey: ["image-analyses", id],
      queryFn: () => mocks.get(id),
    }),
  },
}));
vi.mock("@/entities/notification", () => ({
  useNotificationSessionScope: () => "session",
}));
vi.mock("@/widgets/route-header", () => ({
  selectAnalysisBanner: () => undefined,
}));
vi.mock("@/widgets/ingredient-draft-form", () => ({
  createEmptyDraft: () => ({}),
}));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

it("여러 사진을 업로드해 하나의 분석을 요청하고 목록을 무효화하며 화면을 떠난 뒤 결과 페이지로 강제 이동하지 않는다", async () => {
  const client = new QueryClient();
  const listKey = ["image-analyses", "list", "session"];
  client.setQueryData(listKey, { analyses: [] });
  mocks.upload.mockImplementation(async (file: File) => `images/${file.name}`);
  mocks.submit.mockResolvedValue({
    analysisId: "job-1",
    status: "QUEUED",
    expiresAt: null,
  });
  let finish!: (value: object) => void;
  mocks.get.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result, unmount } = renderHook(() => useReceiptAnalysis(), {
    wrapper,
  });
  const files = [new File(["a"], "a.jpg"), new File(["b"], "b.jpg")];
  act(() => result.current.analyze(files));
  await waitFor(() => expect(mocks.get).toHaveBeenCalledWith("job-1"));
  expect(mocks.upload).toHaveBeenCalledTimes(2);
  expect(mocks.upload).toHaveBeenCalledWith(files[0], "ANALYSIS");
  expect(mocks.upload).toHaveBeenCalledWith(files[1], "ANALYSIS");
  expect(mocks.submit).toHaveBeenCalledWith(["images/a.jpg", "images/b.jpg"]);
  await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
  expect(result.current.isAnalyzing).toBe(true);
  unmount();
  await act(async () =>
    finish({ analysisId: "job-1", status: "COMPLETED", results: [] }),
  );
  expect(mocks.push).not.toHaveBeenCalled();
  client.clear();
});

it.each([
  [
    "IMAGE-429-001",
    "2026-10-17T03:00:00Z",
    "오늘 분석할 수 있는 사진 100장을 모두 사용했어요",
  ],
  [
    "IMAGE-503-001",
    "2026-10-17T23:59:00Z",
    "영수증 인식 기능은 오전 9시부터 오후 6시까지만 사용할 수 있어요",
  ],
  [
    "IMAGE-503-001",
    "2026-10-17T00:00:00Z",
    "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요",
  ],
  [
    "IMAGE-503-001",
    "2026-10-17T08:59:00Z",
    "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요",
  ],
  [
    "IMAGE-503-001",
    "2026-10-17T09:00:00Z",
    "영수증 인식 기능은 오전 9시부터 오후 6시까지만 사용할 수 있어요",
  ],
])(
  "%s 접수 실패를 한국 시간 %s에 맞게 안내한다",
  async (code, time, message) => {
    vi.setSystemTime(new Date(time));
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    mocks.upload.mockResolvedValue("receipt.jpg");
    mocks.submit.mockRejectedValue(
      new ApiError(code === "IMAGE-429-001" ? 429 : 503, {
        code,
        title: "실패",
      }),
    );
    const { result } = renderHook(() => useReceiptAnalysis(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    act(() => result.current.analyze([new File(["a"], "receipt.jpg")]));
    await waitFor(() =>
      expect(showAppToast).toHaveBeenCalledWith({ message, variant: "error" }),
    );
    expect(result.current.isAnalyzing).toBe(false);
    expect(mocks.get).not.toHaveBeenCalled();
    client.clear();
  },
);

it.each([
  ["ANALYSIS_EXPIRED", "분석 시간이 초과됐어요. 잠시 후 다시 시도해 주세요."],
  [
    "ANALYSIS_UNAVAILABLE",
    "AI 서버의 일시적인 오류로 인식하지 못했어요. 잠시 후 다시 시도해 주세요.",
  ],
])("분석 결과의 %s는 사진 재촬영 안내와 구분한다", async (code, message) => {
  const client = new QueryClient();
  mocks.upload.mockResolvedValue("receipt.jpg");
  mocks.submit.mockResolvedValue({
    analysisId: "failed-job",
    status: "QUEUED",
  });
  mocks.get.mockResolvedValue({
    analysisId: "failed-job",
    status: "FAILED",
    error: null,
    results: [
      {
        imageObjectKey: "receipt.jpg",
        status: "FAILED",
        items: [],
        error: { code },
      },
    ],
  });
  const { result } = renderHook(() => useReceiptAnalysis(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  act(() => result.current.analyze([new File(["a"], "receipt.jpg")]));
  await waitFor(() => expect(result.current.failure).toBe("FAILED"));
  expect(result.current.failureMessage).toBe(message);
  expect(result.current.isAnalyzing).toBe(false);
  expect(mocks.push).not.toHaveBeenCalled();
  client.clear();
});
