// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ImageAnalysis } from "@/entities/image";

import { RegisterIngredientReceiptResultPage } from "./register-ingredient-receipt-result-page";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  replace: vi.fn(),
  form: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/entities/image", () => ({
  useDeleteImageAnalysis: () => ({ mutate: vi.fn(), isPending: false }),
  imageAnalysisQueries: {
    detail: (id: string) => ({
      queryKey: ["image-analyses", id],
      queryFn: () => mocks.get(id),
      retry: false,
    }),
  },
}));
vi.mock("@/features/ingredient-form", async () => ({
  sanitizeIngredientNameInput: (
    await import("@/features/ingredient-form/lib/ingredient-name")
  ).sanitizeIngredientNameInput,
}));
vi.mock("@/entities/ingredient", () => ({
  INGREDIENT_CATEGORIES: ["DAIRY", "OTHER"],
  INGREDIENT_STORAGE_TYPES: ["REFRIGERATED", "FROZEN"],
}));
vi.mock("@/shared/ui/app-link", () => ({
  AppLink: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/shared/ui/async-view-state", () => ({
  AsyncViewState: ({ title, action }: { title: string; action: ReactNode }) => (
    <div>
      {title}
      {action}
    </div>
  ),
  asyncViewActionClassName: "",
}));
vi.mock("@/shared/ui/page-action-layout", () => ({
  PageActionLayout: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/widgets/ingredient-draft-form", () => ({
  createEmptyDraft: () => ({
    category: "OTHER",
    name: "",
    storageType: "REFRIGERATED",
    quantity: "",
    weightValue: "",
    weightUnit: "G",
    expirationDate: "",
  }),
  RegisterCapacityBoundary: ({
    children,
  }: {
    children: (capacity: object) => ReactNode;
  }) => children({}),
  IngredientDraftCard: () => <div>수정 가능한 재료</div>,
  RegisterSummaryLine: () => null,
  RegisterSubmitButton: () => null,
  RegisterLeaveGuard: () => null,
  RegisterCompleteDialog: () => null,
  EMPTY_DRAFTS_MESSAGE: "등록할 재료가 없어요",
}));
vi.mock("../model/use-receipt-result-form", () => ({
  useReceiptResultForm: (result: unknown) => {
    mocks.form(result);
    return {
      form: {},
      fields: [{ id: "field-1" }],
      statuses: [],
      expirationNotes: [],
      photoCount: 1,
      hasUncertain: false,
      isTruncated: false,
      submit: vi.fn(),
    };
  },
}));
vi.mock("./recognition-status-chip", () => ({
  RecognitionStatusChip: () => null,
}));

const completed: ImageAnalysis = {
  analysisId: "job-1",
  status: "COMPLETED",
  submittedAt: "2026-10-16T10:00:00Z",
  expiresAt: "2026-10-23T10:00:00Z",
  pollAfterMs: null,
  error: null,
  results: [
    {
      imageObjectKey: "receipt.jpg",
      status: "COMPLETED",
      recognitionStatus: "RECOGNIZED",
      documentType: "RECEIPT",
      error: null,
      items: [
        {
          itemId: "item-1",
          displayStatus: "RECOGNIZED",
          name: "우유",
          category: "DAIRY",
          storageType: "REFRIGERATED",
          measureType: "COUNT",
          quantity: 2,
          weight: null,
          expiration: "2026-10-20",
          reviewReasons: [],
        },
      ],
    },
  ],
};
let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  client = new QueryClient();
});
afterEach(() => {
  cleanup();
  client.clear();
});
function openResult() {
  return render(
    <QueryClientProvider client={client}>
      <RegisterIngredientReceiptResultPage analysisId="job-1" />
    </QueryClientProvider>,
  );
}

it("restores a directly opened result from its ID without relying on an in-memory draft", async () => {
  mocks.get.mockResolvedValue(completed);
  openResult();
  await screen.findByText("수정 가능한 재료");
  expect(mocks.get).toHaveBeenCalledWith("job-1");
  expect(mocks.form).toHaveBeenCalledWith(
    expect.objectContaining({
      analysisId: "job-1",
      origins: [{ imageObjectKey: "receipt.jpg", itemId: "item-1" }],
      drafts: [expect.objectContaining({ name: "우유" })],
    }),
  );
  expect(mocks.replace).not.toHaveBeenCalled();
});

it("shows in-progress jobs without prematurely creating an editable form", async () => {
  mocks.get.mockResolvedValue({
    ...completed,
    status: "PROCESSING",
    expiresAt: null,
    results: [{ ...completed.results[0], status: "PROCESSING", items: [] }],
  });
  openResult();
  await screen.findByText("사진 인식 중 · 0/1장");
  expect(mocks.form).not.toHaveBeenCalled();
  expect(screen.getByRole("link").getAttribute("href")).toBe("/");
});

it("keeps the result URL on read failure and offers a retry", async () => {
  mocks.get.mockRejectedValue(new Error("offline"));
  openResult();
  await screen.findByText("인식 결과를 불러오지 못했어요");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeTruthy(),
  );
  expect(mocks.form).not.toHaveBeenCalled();
  expect(mocks.replace).not.toHaveBeenCalled();
});
