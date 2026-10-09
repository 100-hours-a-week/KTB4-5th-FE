import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { ApiError, SessionExpiredError } from "@/shared/api";

import type { IngredientListQuery } from "../model/ingredient-list-query";
import { getIngredientDetail } from "./get-ingredient-detail";
import { getAllIngredients, getIngredientList } from "./get-ingredient-list";

function retryIngredientList(failureCount: number, error: Error): boolean {
  return (
    !(
      error instanceof ApiError &&
      error.status === 400 &&
      error.code === "INGREDIENT-400-004"
    ) && failureCount < 2
  );
}

function retryIngredientRead(failureCount: number, error: Error): boolean {
  return (
    !(error instanceof SessionExpiredError) &&
    !(error instanceof ApiError && error.status < 500) &&
    failureCount < 2
  );
}

export const ingredientQueries = {
  byRefrigerator: (refrigeratorId: string) =>
    ["refrigerators", refrigeratorId, "ingredients"] as const,
  details: (refrigeratorId: string) =>
    [...ingredientQueries.byRefrigerator(refrigeratorId), "detail"] as const,
  detail: (refrigeratorId: string, ingredientId: string) =>
    queryOptions({
      meta: { monitoringOperation: "ingredient.detail" },
      queryKey: [
        ...ingredientQueries.details(refrigeratorId),
        ingredientId,
      ] as const,
      queryFn: ({ signal }) => getIngredientDetail({ ingredientId, signal }),
      retry: retryIngredientRead,
    }),
  lists: (refrigeratorId: string) =>
    [...ingredientQueries.byRefrigerator(refrigeratorId), "list"] as const,
  list: (refrigeratorId: string, query: IngredientListQuery) =>
    infiniteQueryOptions({
      meta: { monitoringOperation: "ingredient.list" },
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
      meta: { monitoringOperation: "ingredient.list" },
      queryKey: [...ingredientQueries.firstPages(refrigeratorId), query],
      queryFn: ({ signal }) =>
        getIngredientList({ refrigeratorId, query, cursor: null, signal }),
      retry: retryIngredientList,
    }),
  allPages: (refrigeratorId: string, query: IngredientListQuery) =>
    queryOptions({
      meta: { monitoringOperation: "ingredient.list" },
      queryKey: [
        ...ingredientQueries.byRefrigerator(refrigeratorId),
        "all-pages",
        query,
      ] as const,
      queryFn: ({ signal }) =>
        getAllIngredients({ refrigeratorId, query, signal }),
      retry: retryIngredientRead,
    }),
};
