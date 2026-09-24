import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { ApiError } from "@/shared/api";

import type { IngredientListQuery } from "../model/ingredient-list-query";
import { getIngredientList } from "./get-ingredient-list";

function retryIngredientList(failureCount: number, error: Error): boolean {
  return (
    !(
      error instanceof ApiError &&
      error.status === 400 &&
      error.code === "REFRIGERATOR-400-008"
    ) && failureCount < 2
  );
}

export const ingredientQueries = {
  byRefrigerator: (refrigeratorId: string) =>
    ["refrigerators", refrigeratorId, "ingredients"] as const,
  lists: (refrigeratorId: string) =>
    [...ingredientQueries.byRefrigerator(refrigeratorId), "list"] as const,
  list: (refrigeratorId: string, query: IngredientListQuery) =>
    infiniteQueryOptions({
      queryKey: [...ingredientQueries.lists(refrigeratorId), query],
      queryFn: ({ pageParam, signal }) =>
        getIngredientList({ refrigeratorId, query, cursor: pageParam, signal }),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      retry: retryIngredientList,
    }),
  firstPages: (refrigeratorId: string) =>
    [
      ...ingredientQueries.byRefrigerator(refrigeratorId),
      "first-page",
    ] as const,
  firstPage: (refrigeratorId: string, query: IngredientListQuery) =>
    queryOptions({
      queryKey: [...ingredientQueries.firstPages(refrigeratorId), query],
      queryFn: ({ signal }) =>
        getIngredientList({ refrigeratorId, query, cursor: null, signal }),
      retry: retryIngredientList,
    }),
};
