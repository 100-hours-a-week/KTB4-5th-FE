// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { useReceiptAnalysis } from "./use-receipt-analysis";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  submit: vi.fn(),
  get: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/entities/image", () => ({
  uploadImage: mocks.upload,
  requestImageAnalysis: mocks.submit,
  imageAnalysisQueries: {
    lists: () => ["image-analyses", "list"],
    detail: (id: string) => ({
      queryKey: ["image-analyses", id],
      queryFn: () => mocks.get(id),
    }),
  },
}));
vi.mock("@/widgets/ingredient-draft-form", () => ({
  createEmptyDraft: () => ({}),
}));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast: vi.fn() }));

afterEach(() => {
  cleanup();
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
  expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
  expect(result.current.isAnalyzing).toBe(true);
  unmount();
  await act(async () =>
    finish({ analysisId: "job-1", status: "COMPLETED", results: [] }),
  );
  expect(mocks.push).not.toHaveBeenCalled();
  client.clear();
});
