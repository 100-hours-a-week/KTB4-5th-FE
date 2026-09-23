import { infiniteQueryOptions } from "@tanstack/react-query";

import type { IngredientListQuery } from "../model/ingredient-list-query";
import { getIngredientList } from "./get-ingredient-list";

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
    }),
};
