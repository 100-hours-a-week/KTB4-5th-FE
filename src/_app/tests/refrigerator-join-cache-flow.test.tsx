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
import { useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { HomePage } from "@/_pages/home";
import { RefrigeratorPage } from "@/_pages/refrigerator";
import {
  DEFAULT_INGREDIENT_LIST_QUERY,
  ingredientQueries,
  type Ingredient,
  type IngredientListPage,
} from "@/entities/ingredient";
import { useJoinRefrigerator } from "@/features/share-refrigerator";
import { getTodayInSeoul } from "@/shared/lib/seoul-date";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast: vi.fn() }));
vi.mock("@/_pages/home/ui/home-attention-section", () => ({
  HomeAttentionSection: ({ items }: { items: Ingredient[] }) => (
    <div>
      {items.map((item) => (
        <span key={item.ingredientId}>{item.name}</span>
      ))}
    </div>
  ),
}));
vi.mock("@/_pages/home/ui/home-recommendation-notice", () => ({
  HomeRecommendationNotice: () => null,
}));
vi.mock("@/_pages/refrigerator/ui/ingredient-controls-container", () => ({
  IngredientControlsContainer: () => null,
}));
vi.mock("@/_pages/refrigerator/ui/ingredient-list-container", () => ({
  IngredientListContainer: ({
    ingredients,
    onFetchNextPage,
    hasNextPage,
  }: {
    ingredients: Ingredient[];
    onFetchNextPage: () => void;
    hasNextPage: boolean;
  }) => (
    <div>
      {ingredients.map((item) => (
        <span key={item.ingredientId}>{item.name}</span>
      ))}
      <button disabled={!hasNextPage} onClick={onFetchNextPage}>
        다음 페이지
      </button>
    </div>
  ),
}));

function page(
  name: string,
  nextCursor: string | null = null,
): IngredientListPage {
  return {
    baseDate: getTodayInSeoul(),
    outdated: false,
    ingredientsNum: 2,
    filteredCount: 2,
    refrigeratorCapacity: 1500,
    refrigeratorName: name,
    nextCursor,
    ingredients: [
      {
        ingredientId: name,
        name,
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
}

function Flow() {
  const [tab, setTab] = useState("home");
  const join = useJoinRefrigerator({
    onError: (error) => {
      throw error;
    },
  });
  return (
    <>
      <button onClick={() => join.mutate("KTB150")}>참여</button>
      <button onClick={() => setTab("refrigerator")}>냉장고 탭</button>
      {tab === "home" ? <HomePage /> : <RefrigeratorPage />}
    </>
  );
}

let client: QueryClient;
const reload = vi.fn();
let releaseHome: () => void;
let releaseTab: () => void;
const requests: string[] = [];

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  document.cookie = "currentRefrigeratorId=7; path=/";
  document.cookie = "XSRF-TOKEN=csrf; path=/";
  localStorage.clear();
  vi.stubEnv("NEXT_PUBLIC_KAKAOTECH_INVITE_CODE", "");
  vi.stubGlobal("location", { pathname: "/", reload });
  requests.length = 0;
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it.each([false, true])(
  "참여 후 홈의 새 첫 페이지를 탭에서 재사용하고 이전 냉장고·커서를 섞지 않는다 (재참여 캐시: %s)",
  async (hasPreviousCache) => {
    const personalKey = ingredientQueries.firstPage(
      "7",
      DEFAULT_INGREDIENT_LIST_QUERY,
    ).queryKey;
    const homeKey = ingredientQueries.firstPage(
      "150",
      DEFAULT_INGREDIENT_LIST_QUERY,
    ).queryKey;
    const listKey = ingredientQueries.list(
      "150",
      DEFAULT_INGREDIENT_LIST_QUERY,
    ).queryKey;
    client.setQueryData(personalKey, page("개인 재고"));
    if (hasPreviousCache) {
      client.setQueryData(homeKey, page("과거 카테부 재고", "old-cursor"));
      client.setQueryData(listKey, {
        pages: [
          page("과거 카테부 재고", "old-cursor"),
          page("과거 둘째 페이지"),
        ],
        pageParams: [null, "old-cursor"],
      });
    }
    const homeResponse = new Promise<void>((resolve) => {
      releaseHome = resolve;
    });
    const tabResponse = new Promise<void>((resolve) => {
      releaseTab = resolve;
    });
    let firstPageRequests = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string, init?: RequestInit) => {
        requests.push(input);
        if (
          input === "/api/v1/refrigerators/members" &&
          init?.method === "POST"
        ) {
          return Response.json({
            code: "REFRIGERATOR-201-001",
            message: "ok",
            data: { refrigeratorId: "150" },
          });
        }
        const url = new URL(input, "https://example.test");
        if (url.pathname === "/api/v1/refrigerators/150/ingredients") {
          const cursor = url.searchParams.get("cursor");
          if (cursor) {
            expect(cursor).toBe("fresh-cursor");
            return Response.json({
              code: "TEST-200-001",
              message: "ok",
              data: page("새 둘째 페이지"),
            });
          }
          if (!url.searchParams.has("filter")) {
            firstPageRequests += 1;
            await (firstPageRequests === 1 ? homeResponse : tabResponse);
          }
          return Response.json({
            code: "TEST-200-001",
            message: "ok",
            data: page("새 카테부 재고", "fresh-cursor"),
          });
        }
        throw new Error(`Unexpected request: ${input}`);
      }),
    );
    render(
      <QueryClientProvider client={client}>
        <Flow />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("개인 재고")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "참여" }));
    await waitFor(() =>
      expect(document.cookie).toContain("currentRefrigeratorId=150"),
    );
    // 참여 API가 끝나면 홈 데이터 응답을 기다리는 동안에도 선택한 냉장고는 바뀐다.
    expect(screen.queryByText("개인 재고")).toBeNull();
    expect(screen.queryByText("과거 카테부 재고")).toBeNull();
    await act(async () => releaseHome());
    expect(await screen.findByText("새 카테부 재고")).toBeTruthy();
    const homePage = client.getQueryData(homeKey);
    fireEvent.click(screen.getByRole("button", { name: "냉장고 탭" }));
    // 탭의 네트워크 응답을 보류해도 홈에서 받은 첫 페이지를 즉시 표시한다.
    expect(screen.getByText("새 카테부 재고")).toBeTruthy();
    expect(screen.queryByText("과거 카테부 재고")).toBeNull();
    expect(screen.queryByText("과거 둘째 페이지")).toBeNull();
    expect(client.getQueryData(listKey)).toEqual({
      pages: [homePage],
      pageParams: [null],
    });
    await act(async () => releaseTab());
    fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));
    expect(await screen.findByText("새 둘째 페이지")).toBeTruthy();
    expect(requests.some((url) => url.includes("old-cursor"))).toBe(false);
    expect(requests.some((url) => url.includes("/7/"))).toBe(false);
    expect(reload).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  },
);
