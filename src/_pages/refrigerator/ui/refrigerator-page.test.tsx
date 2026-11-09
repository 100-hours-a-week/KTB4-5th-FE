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
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import {
  ingredientQueries,
  parseIngredientListQuery,
  type Ingredient,
  type IngredientListPage,
} from "@/entities/ingredient";
import { getTodayInSeoul } from "@/shared/lib/seoul-date";

import { RefrigeratorPage } from "./refrigerator-page";

let params = new URLSearchParams();
const { scrollTrigger } = vi.hoisted(() => ({ scrollTrigger: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => params,
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast: vi.fn() }));
vi.mock("../model/use-ingredient-list-prefetch", () => ({
  useIngredientListPrefetch: () => vi.fn(),
}));
vi.mock("@/shared/lib/infinite-scroll", () => ({
  useInfiniteScrollTrigger: (options: unknown) => {
    scrollTrigger(options);
    return { current: null };
  },
}));
vi.mock("./ingredient-controls-container", () => ({
  IngredientControlsContainer: () => null,
}));
vi.mock("./ingredient-card-list", () => ({
  IngredientCardList: ({ ingredients }: { ingredients: Ingredient[] }) => (
    <div>
      {ingredients.map((item) => (
        <span key={item.ingredientId}>{item.name}</span>
      ))}
    </div>
  ),
}));

const page: IngredientListPage = {
  baseDate: getTodayInSeoul(),
  outdated: false,
  ingredientsNum: 1,
  filteredCount: 1,
  refrigeratorCapacity: 1500,
  refrigeratorName: "우리집",
  nextCursor: "next",
  ingredients: [
    {
      ingredientId: "1",
      name: "우유",
      category: "DAIRY",
      measureType: "COUNT",
      quantity: 1,
      weightValue: null,
      weightUnit: "NONE",
      storageType: "REFRIGERATED",
      status: "EXPIRING_SOON",
      daysUntilExpiration: 1,
    },
  ],
};
let client: QueryClient;
let fail: boolean;
const fetchMock = vi.fn();

beforeEach(() => {
  params = new URLSearchParams();
  client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  document.cookie = "currentRefrigeratorId=7; path=/";
  fail = true;
  fetchMock.mockImplementation(async () =>
    fail
      ? new Response("Bad Gateway", { status: 502 })
      : Response.json({
          code: "INGREDIENT-200-001",
          message: "ok",
          data: { ...page, nextCursor: null },
        }),
  );
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  client.clear();
  document.cookie = "currentRefrigeratorId=; Max-Age=0; path=/";
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function mount() {
  render(
    <QueryClientProvider client={client}>
      <RefrigeratorPage />
    </QueryClientProvider>,
  );
}

it.each(["home", "filtered", "none"])(
  "%s: 첫 페이지 502를 표시하고 같은 조건으로 재시도한다",
  async (cache) => {
    if (cache === "filtered")
      params = new URLSearchParams(
        "category=DAIRY&filter=EXPIRING_SOON&sort=NAME_ASC&keyword=우유",
      );
    const query = parseIngredientListQuery(Object.fromEntries(params));
    const options = ingredientQueries.list("7", query);
    if (cache === "home")
      client.setQueryData(
        ingredientQueries.firstPage("7", query).queryKey,
        page,
      );
    if (cache === "filtered")
      client.setQueryData(
        options.queryKey,
        { pages: [page], pageParams: [null] },
        { updatedAt: 1 },
      );
    mount();

    expect(
      await screen.findByRole("button", { name: "다시 시도" }),
    ).toBeTruthy();
    expect(screen.queryByText("우유")).toBeNull();
    if (cache !== "none")
      expect(client.getQueryData(options.queryKey)).toEqual({
        pages: [page],
        pageParams: [null],
      });
    const failedUrl = fetchMock.mock.calls[0][0];
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("우유")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull();
    expect(fetchMock.mock.lastCall?.[0]).toBe(failedUrl);
  },
);

it("다음 페이지 502는 목록을 유지하고 하단에서 같은 커서로 재시도한다", async () => {
  const options = ingredientQueries.list("7", parseIngredientListQuery({}));
  client.setQueryData(options.queryKey, { pages: [page], pageParams: [null] });
  client.setQueryDefaults(options.queryKey, { refetchOnMount: false });
  mount();
  await act(async () => {
    await scrollTrigger.mock.lastCall?.[0].onLoadMore();
  });

  expect(await screen.findByRole("button", { name: "다시 시도" })).toBeTruthy();
  expect(screen.getByText("우유")).toBeTruthy();
  fail = false;
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull(),
  );
  expect(fetchMock.mock.lastCall?.[0]).toContain("cursor=next");
});
