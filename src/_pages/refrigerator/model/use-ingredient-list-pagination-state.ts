"use client";

import {
  hashKey,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
  type UIEvent,
} from "react";

import type { IngredientListPage } from "@/entities/ingredient";
import { ApiError } from "@/shared/api";

const INVALID_INGREDIENT_LIST_CURSOR_CODE = "INGREDIENT-400-004";
const scrollPositions = new Map<string, number>();

type UseIngredientListPaginationStateParams = {
  queryKey: QueryKey;
  reuseCachedSearch: boolean;
  error: Error | null;
};

type IngredientListPaginationState = {
  scrollContainerRef: RefObject<HTMLElement | null>;
  handleScroll: (event: UIEvent<HTMLElement>) => void;
};

function isInvalidIngredientListCursor(error: Error | null): boolean {
  return (
    error instanceof ApiError &&
    error.status === 400 &&
    error.code === INVALID_INGREDIENT_LIST_CURSOR_CODE
  );
}

export function useIngredientListPaginationState({
  queryKey,
  reuseCachedSearch,
  error,
}: UseIngredientListPaginationStateParams): IngredientListPaginationState {
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLElement>(null);
  const scrollKey = hashKey(queryKey);
  const previousScrollKey = useRef(scrollKey);

  useEffect(() => {
    if (!isInvalidIngredientListCursor(error)) return;

    scrollPositions.delete(scrollKey);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    void queryClient.resetQueries({ queryKey, exact: true });
  }, [error, queryClient, queryKey, scrollKey]);

  useLayoutEffect(() => {
    if (previousScrollKey.current !== scrollKey) {
      scrollPositions.delete(scrollKey);
      if (reuseCachedSearch) {
        const cached = queryClient.getQueryData<
          InfiniteData<IngredientListPage, string | null>
        >(queryKey);
        if (cached && cached.pages.length > 1) {
          queryClient.setQueryData(
            queryKey,
            {
              pages: cached.pages.slice(0, 1),
              pageParams: cached.pageParams.slice(0, 1),
            },
            { updatedAt: queryClient.getQueryState(queryKey)?.dataUpdatedAt },
          );
        }
      } else {
        void queryClient.resetQueries({ queryKey, exact: true });
      }
      previousScrollKey.current = scrollKey;
    }

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollPositions.get(scrollKey) ?? 0;
    }
  }, [queryClient, queryKey, reuseCachedSearch, scrollKey]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLElement>) => {
      scrollPositions.set(scrollKey, event.currentTarget.scrollTop);
    },
    [scrollKey],
  );

  return { scrollContainerRef, handleScroll };
}
