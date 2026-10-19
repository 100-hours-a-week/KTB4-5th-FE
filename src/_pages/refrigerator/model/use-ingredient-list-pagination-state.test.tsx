// @vitest-environment jsdom

import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import {
  ingredientQueries,
  type IngredientListPage,
  type IngredientListQuery,
} from "@/entities/ingredient";

import { useIngredientListPaginationState } from "./use-ingredient-list-pagination-state";

it("reuses a searched keyword's cached first page without another request", () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const query = (keyword: string): IngredientListQuery => ({
    filter: null,
    category: null,
    sort: "EXPIRATION_ASC",
    keyword,
  });
  const pork = ingredientQueries.list("fridge-1", query("돼지"));
  const porkNeck = ingredientQueries.list("fridge-1", query("돼지 목"));
  const page = (nextCursor: string | null): IngredientListPage => ({
    baseDate: "2026-09-16",
    outdated: false,
    ingredientsNum: 2,
    filteredCount: 2,
    refrigeratorCapacity: 100,
    refrigeratorName: "우리집",
    ingredients: [],
    nextCursor,
  });
  const firstPage = page("next");
  client.setQueryData<InfiniteData<IngredientListPage, string | null>>(
    pork.queryKey,
    { pages: [firstPage, page(null)], pageParams: [null, "next"] },
  );
  client.setQueryData<InfiniteData<IngredientListPage, string | null>>(
    porkNeck.queryKey,
    { pages: [page(null)], pageParams: [null] },
  );
  const updatedAt = client.getQueryState(pork.queryKey)?.dataUpdatedAt;
  const fetchPage = vi.fn(async () => page(null));

  const { rerender } = renderHook(
    ({ keyword }: { keyword: string }) => {
      const options = ingredientQueries.list("fridge-1", query(keyword));
      const list = useInfiniteQuery({ ...options, queryFn: fetchPage });
      useIngredientListPaginationState({
        queryKey: options.queryKey,
        error: list.error,
      });
      return list;
    },
    {
      initialProps: { keyword: "돼지" },
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );

  rerender({ keyword: "돼지 목" });
  rerender({ keyword: "돼지" });

  expect(fetchPage).not.toHaveBeenCalled();
  expect(client.getQueryData(pork.queryKey)).toEqual({
    pages: [firstPage],
    pageParams: [null],
  });
  expect(client.getQueryState(pork.queryKey)?.dataUpdatedAt).toBe(updatedAt);
});
