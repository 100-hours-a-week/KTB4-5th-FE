"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo } from "react";

import {
  ingredientQueries,
  IngredientRefrigeratorRequiredState,
  parseIngredientListQuery,
} from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";

import { useIngredientListPaginationState } from "../model/use-ingredient-list-pagination-state";
import { useIngredientListPrefetch } from "../model/use-ingredient-list-prefetch";
import { IngredientControlsContainer } from "./ingredient-controls-container";
import { IngredientDisposeBanner } from "./ingredient-dispose-banner";
import { IngredientListContainer } from "./ingredient-list-container";

type RefrigeratorPageProps = {
  initialRefrigeratorId?: string;
};

export function RefrigeratorPage({
  initialRefrigeratorId,
}: RefrigeratorPageProps) {
  const searchParams = useSearchParams();
  const query = useMemo(
    () => parseIngredientListQuery(Object.fromEntries(searchParams)),
    [searchParams],
  );
  const deferredQuery = useDeferredValue(query);
  const storedRefrigeratorId = useCurrentRefrigeratorId();
  const refrigeratorId =
    storedRefrigeratorId === undefined
      ? initialRefrigeratorId
      : storedRefrigeratorId;
  const queryClient = useQueryClient();
  const options = useMemo(() => {
    const firstPageKey = ingredientQueries.firstPage(
      refrigeratorId ?? "",
      deferredQuery,
    ).queryKey;

    const getFirstPageState = () => {
      const state = queryClient.getQueryState(firstPageKey);
      return state?.data && !state.isInvalidated ? state : undefined;
    };

    return {
      ...ingredientQueries.list(refrigeratorId ?? "", deferredQuery),
      enabled: Boolean(refrigeratorId),
      initialData: () => {
        const state = getFirstPageState();
        return state?.data
          ? { pages: [state.data], pageParams: [null] }
          : undefined;
      },
      initialDataUpdatedAt: () => getFirstPageState()?.dataUpdatedAt,
    };
  }, [queryClient, refrigeratorId, deferredQuery]);
  const {
    data,
    error,
    isPending,
    isError,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(options);
  const { scrollContainerRef, handleScroll } = useIngredientListPaginationState(
    {
      queryKey: options.queryKey,
      error,
    },
  );
  const prefetch = useIngredientListPrefetch(
    refrigeratorId,
    query,
    Boolean(data),
  );

  const firstPage = data?.pages[0];
  const ingredients = useMemo(
    () => data?.pages.flatMap((page) => page.ingredients) ?? [],
    [data],
  );
  const canDisposeExpired =
    deferredQuery.filter === "EXPIRED" && (firstPage?.filteredCount ?? 0) > 0;

  async function fetchAllPages() {
    let hasMore = Boolean(hasNextPage);
    while (hasMore) {
      const result = await fetchNextPage({ cancelRefetch: false });
      if (result.isError) {
        return false;
      }
      hasMore = result.hasNextPage;
    }
    return true;
  }

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <IngredientControlsContainer
        query={query}
        filteredCount={firstPage?.filteredCount ?? 0}
        isLoading={!firstPage}
        onPrefetch={prefetch}
      />

      <div className="flex-none px-5 pt-4">
        <div className="border-t border-dashed border-app-ink/20" />
      </div>

      <section
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[calc(var(--space-6)+var(--safe-bottom))] [-webkit-overflow-scrolling:touch]"
        aria-label="재고 목록"
      >
        {canDisposeExpired && refrigeratorId ? (
          <div className="pb-4">
            <IngredientDisposeBanner
              refrigeratorId={refrigeratorId}
              expiredCount={firstPage?.filteredCount ?? 0}
              expiredIngredients={ingredients}
              onLoadAll={fetchAllPages}
            />
          </div>
        ) : null}
        {refrigeratorId === null ? (
          <IngredientRefrigeratorRequiredState />
        ) : (
          <IngredientListContainer
            query={deferredQuery}
            ingredients={ingredients}
            scrollContainerRef={scrollContainerRef}
            isPending={isPending}
            isInitialError={isError && !data}
            isFetchingNextPage={isFetchingNextPage}
            isFetchNextPageError={isFetchNextPageError}
            hasNextPage={Boolean(hasNextPage)}
            onFetchNextPage={() => fetchNextPage({ cancelRefetch: false })}
            onRetry={() => void refetch()}
            error={error}
          />
        )}
      </section>
    </main>
  );
}
