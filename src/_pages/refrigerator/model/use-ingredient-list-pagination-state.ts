"use client";

import { hashKey, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
  type UIEvent,
} from "react";

import { ApiError } from "@/shared/api";

const INVALID_INGREDIENT_LIST_CURSOR_CODE = "REFRIGERATOR-400-008";
const scrollPositions = new Map<string, number>();

type UseIngredientListPaginationStateParams = {
  queryKey: QueryKey;
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

  useEffect(() => {
    if (previousScrollKey.current !== scrollKey) {
      scrollPositions.delete(scrollKey);
      void queryClient.resetQueries({ queryKey, exact: true });
      previousScrollKey.current = scrollKey;
    }

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollPositions.get(scrollKey) ?? 0;
    }
  }, [queryClient, queryKey, scrollKey]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLElement>) => {
      scrollPositions.set(scrollKey, event.currentTarget.scrollTop);
    },
    [scrollKey],
  );

  return { scrollContainerRef, handleScroll };
}
