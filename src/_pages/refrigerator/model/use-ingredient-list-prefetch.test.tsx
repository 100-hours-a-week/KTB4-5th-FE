// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import type { IngredientListQuery } from "@/entities/ingredient";

import { useIngredientListPrefetch } from "./use-ingredient-list-prefetch";

it("does not prefetch other filters while searching", () => {
  const client = new QueryClient();
  const prefetchInfiniteQuery = vi.spyOn(client, "prefetchInfiniteQuery");
  const query: IngredientListQuery = {
    filter: null,
    category: null,
    sort: "EXPIRATION_ASC",
    keyword: "두부",
  };
  const { result } = renderHook(
    () => useIngredientListPrefetch("fridge-1", query, true),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );

  act(() => result.current({ filter: "REFRIGERATED" }));
  expect(prefetchInfiniteQuery).not.toHaveBeenCalled();
});
