// @vitest-environment jsdom

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import {
  DEFAULT_INGREDIENT_LIST_QUERY,
  ingredientQueries,
} from "@/entities/ingredient";
import { RefrigeratorHeaderTitle } from "./refrigerator-header-title";

vi.mock("@/entities/refrigerator", () => ({
  useCurrentRefrigeratorId: () => "17",
  formatRefrigeratorTitle: (name: string) => `${name}네 냉장고`,
}));

let client: QueryClient;
afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
});

// 홈과 같은 Query Key를 구독해 제목과 요약이 하나의 응답을 공유하는지 확인한다.
function Summary() {
  const { data } = useQuery(
    ingredientQueries.firstPage("17", DEFAULT_INGREDIENT_LIST_QUERY),
  );
  return <p>{data ? `재고 ${data.ingredientsNum}종` : "불러오는 중"}</p>;
}

it.each([0, 62])(
  "재고 %i종일 때 냉장고 이름과 요약을 목록 요청 한 번으로 조회한다",
  async (count) => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        code: "INGREDIENT-200-002",
        message: "재고 목록 조회 성공",
        data: {
          baseDate: "2026-10-17",
          outdated: false,
          ingredientsNum: count,
          filteredCount: count,
          refrigeratorCapacity: 1500,
          refrigeratorName: "카테부",
          ingredients: [],
          nextCursor: null,
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <h1>
          <RefrigeratorHeaderTitle fallback="홈" />
        </h1>
        <Summary />
      </QueryClientProvider>,
    );
    await screen.findByRole("heading", { name: "카테부네 냉장고" });
    expect(screen.getByText(`재고 ${count}종`)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/refrigerators/17/ingredients?size=10&sort=EXPIRATION_ASC",
      expect.objectContaining({ credentials: "include" }),
    );
  },
);
