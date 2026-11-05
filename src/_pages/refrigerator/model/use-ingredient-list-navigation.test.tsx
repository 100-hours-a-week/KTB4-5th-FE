// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import {
  DEFAULT_INGREDIENT_LIST_QUERY,
  type IngredientListQuery,
} from "@/entities/ingredient";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";

import { useIngredientListNavigation } from "./use-ingredient-list-navigation";

vi.mock("@/shared/lib/navigation-history", () => ({
  markAppNavigationIntent: vi.fn(),
}));

afterEach(() => vi.restoreAllMocks());

it("preserves the other conditions when changing a filter", () => {
  const replaceState = vi
    .spyOn(window.history, "replaceState")
    .mockImplementation(() => {});
  const query: IngredientListQuery = {
    filter: null,
    category: "VEGETABLE",
    sort: "NAME_ASC",
    keyword: "두부",
  };
  const { result } = renderHook(() => useIngredientListNavigation(query));

  act(() => result.current({ filter: "EXPIRED" }));

  const href = replaceState.mock.calls[0][2] as string;
  const url = new URL(href, "http://localhost");
  expect(url.pathname).toBe("/refrigerator");
  expect(Object.fromEntries(url.searchParams)).toEqual({
    filter: "EXPIRED",
    category: "VEGETABLE",
    sort: "NAME_ASC",
    keyword: "두부",
  });
  expect(markAppNavigationIntent).toHaveBeenCalledWith("replace", href);
});

it("removes the query string when resetting to the default conditions", () => {
  const replaceState = vi
    .spyOn(window.history, "replaceState")
    .mockImplementation(() => {});
  const { result } = renderHook(() =>
    useIngredientListNavigation({
      ...DEFAULT_INGREDIENT_LIST_QUERY,
      filter: "EXPIRED",
    }),
  );

  act(() => result.current({ filter: null }));

  expect(replaceState).toHaveBeenCalledExactlyOnceWith(
    null,
    "",
    "/refrigerator",
  );
});
