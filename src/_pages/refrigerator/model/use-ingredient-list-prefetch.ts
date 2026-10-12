"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import {
  ingredientQueries,
  INGREDIENT_LIST_FILTERS,
  type IngredientListQuery,
} from "@/entities/ingredient";

const PREFETCH_STALE_TIME_MS = 30_000;

export function useIngredientListPrefetch(
  refrigeratorId: string | null | undefined,
  query: IngredientListQuery,
  isReady: boolean,
) {
  const queryClient = useQueryClient();
  const prefetch = useCallback(
    (patch: Partial<IngredientListQuery>) => {
      if (!refrigeratorId || query.keyword) return;
      void queryClient.prefetchInfiniteQuery({
        ...ingredientQueries.list(refrigeratorId, { ...query, ...patch }),
        staleTime: PREFETCH_STALE_TIME_MS,
      });
    },
    [queryClient, refrigeratorId, query],
  );

  useEffect(() => {
    if (!isReady || query.keyword) return;
    for (const filter of [null, ...INGREDIENT_LIST_FILTERS]) {
      if (filter !== query.filter) prefetch({ filter });
    }
  }, [isReady, prefetch, query.filter, query.keyword]);

  return prefetch;
}
