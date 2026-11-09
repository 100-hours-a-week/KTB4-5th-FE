// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { ApiError } from "@/shared/api";
import { RecipeDetailPage } from "./recipe-detail-page";

vi.mock("@lineiconshq/free-icons", () => ({ HatChef3Outlined: {} }));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));

const mocks = vi.hoisted(() => ({
  apply: vi.fn(),
  get: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/entities/recommendation", () => ({
  applyRecipe: (...args: unknown[]) => mocks.apply(...args),
  RecipeImage: () => null,
  recommendationQueries: {
    detail: (id: string, recipeId: string) => ({
      queryKey: ["refrigerators", id, "recipes", recipeId],
      queryFn: () => mocks.get(),
    }),
    list: (id: string) => ({
      queryKey: ["refrigerators", id, "recommendations"],
      queryFn: async () => ({ recipes: [] }),
    }),
  },
}));
vi.mock("@/entities/refrigerator", () => ({
  useCurrentRefrigeratorId: () => "1",
  refrigeratorQueries: {
    mypage: () => ({ queryKey: ["mypage"] }),
    current: () => ({ queryKey: ["current"] }),
  },
}));
vi.mock("@/shared/ui/page-action-layout", () => ({
  PageActionLayout: ({
    children,
    action,
  }: {
    children: ReactNode;
    action: ReactNode;
  }) => (
    <main>
      {children}
      {action}
    </main>
  ),
}));
vi.mock("@/shared/ui/app-toast", () => ({
  showAppToast: (...args: unknown[]) => mocks.toast(...args),
}));
vi.mock("./recipe-consume-sheet", () => ({
  RecipeConsumeSheet: ({
    open,
    onConfirm,
  }: {
    open: boolean;
    onConfirm: () => void;
  }) => (open ? <button onClick={onConfirm}>차감 확인</button> : null),
}));
const etag = `"${"a".repeat(64)}"`;
const recipe = {
  recipeId: "RDA:51",
  name: "두부김치",
  imageUrl: null,
  cookingTimeMinutes: null,
  targetServings: null,
  expiringIngredientCount: null,
  ingredients: [],
  steps: [],
  etag,
};
let client: QueryClient;
afterEach(() => {
  cleanup();
  client.clear();
  vi.clearAllMocks();
});
function renderPage() {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  mocks.get.mockResolvedValue(recipe);
  render(
    <QueryClientProvider client={client}>
      <RecipeDetailPage recipeId="RDA:51" recommendationId="123" />
    </QueryClientProvider>,
  );
}
async function apply() {
  fireEvent.click(await screen.findByText("적용하기"));
  fireEvent.click(screen.getByText("차감 확인"));
}
it("retains the key and original ETag after a lost response, even after detail refetch", async () => {
  mocks.apply.mockRejectedValue(new TypeError("Failed to fetch"));
  renderPage();
  await apply();
  await waitFor(() => expect(mocks.apply).toHaveBeenCalledTimes(1));
  const first = mocks.apply.mock.calls[0];
  mocks.get.mockResolvedValue({ ...recipe, etag: `"${"b".repeat(64)}"` });
  await client.invalidateQueries({
    queryKey: ["refrigerators", "1", "recipes"],
  });
  fireEvent.click(screen.getByText("차감 확인"));
  await waitFor(() => expect(mocks.apply).toHaveBeenCalledTimes(2));
  expect(mocks.apply.mock.calls[1]).toEqual(first);
  expect(first).toEqual([
    "1",
    { recommendationId: "123", recipeId: "RDA:51" },
    expect.any(String),
    etag,
  ]);
});
it("on 412 closes the sheet, refreshes detail and uses a new key for the next confirmation", async () => {
  mocks.apply.mockRejectedValue(
    new ApiError(412, {
      code: "RECOMMEND-412-001",
      status: 412,
      title: "Changed",
    }),
  );
  renderPage();
  await apply();
  await waitFor(() => expect(screen.queryByText("차감 확인")).toBeNull());
  await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
  expect(mocks.toast).toHaveBeenCalledWith(
    expect.objectContaining({ variant: "error" }),
  );
  await apply();
  await waitFor(() => expect(mocks.apply).toHaveBeenCalledTimes(2));
  expect(mocks.apply.mock.calls[1][2]).not.toBe(mocks.apply.mock.calls[0][2]);
});

it("blocks applying after 412 until refreshed detail and its new ETag arrive", async () => {
  mocks.apply.mockRejectedValue(
    new ApiError(412, { code: "RECOMMEND-412-001", title: "Changed" }),
  );
  renderPage();
  await screen.findByText("적용하기");
  let finish!: (value: typeof recipe) => void;
  mocks.get.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await apply();
  await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
  expect(screen.queryByText("적용하기")).toBeNull();
  expect(screen.queryByText("차감 확인")).toBeNull();
  expect(mocks.apply).toHaveBeenCalledTimes(1);

  const newEtag = `"${"b".repeat(64)}"`;
  await act(async () =>
    finish({ ...recipe, name: "변경된 요리", etag: newEtag }),
  );
  await screen.findByText("변경된 요리");
  await apply();
  await waitFor(() => expect(mocks.apply).toHaveBeenCalledTimes(2));
  expect(mocks.apply.mock.calls[1][3]).toBe(newEtag);
  expect(mocks.apply.mock.calls[1][2]).not.toBe(mocks.apply.mock.calls[0][2]);
});
