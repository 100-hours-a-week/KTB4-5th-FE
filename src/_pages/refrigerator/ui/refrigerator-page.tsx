"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  ingredientQueries,
  parseIngredientListQuery,
  type RawQueryParams,
} from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";

import { useIngredientListPaginationState } from "../model/use-ingredient-list-pagination-state";
import { IngredientControlsContainer } from "./ingredient-controls-container";
import { IngredientDisposeBanner } from "./ingredient-dispose-banner";
import { IngredientListContainer } from "./ingredient-list-container";

type RefrigeratorPageProps = {
  queryParams: RawQueryParams;
};

export function RefrigeratorPage({ queryParams }: RefrigeratorPageProps) {
  const query = useMemo(
    () => parseIngredientListQuery(queryParams),
    [queryParams],
  );
  const refrigeratorId = useCurrentRefrigeratorId();
  const options = useMemo(
    () => ({
      ...ingredientQueries.list(refrigeratorId ?? "", query),
      enabled: Boolean(refrigeratorId),
    }),
    [refrigeratorId, query],
  );
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

  const firstPage = data?.pages[0];
  const ingredients = data?.pages.flatMap((page) => page.ingredients) ?? [];
  const canDisposeExpired =
    query.filter === "EXPIRED" &&
    (firstPage?.filteredCount ?? 0) > 0 &&
    !hasNextPage;

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <IngredientControlsContainer
        query={query}
        filteredCount={firstPage?.filteredCount ?? 0}
        ingredientsNum={firstPage?.ingredientsNum ?? 0}
        refrigeratorCapacity={firstPage?.refrigeratorCapacity ?? 0}
        isLoading={!firstPage}
      />

      <div className="flex-none px-5 pt-4">
        {canDisposeExpired && refrigeratorId ? (
          <div className="pb-4">
            <IngredientDisposeBanner
              refrigeratorId={refrigeratorId}
              expiredCount={firstPage?.filteredCount ?? 0}
              expiredIngredients={ingredients}
            />
          </div>
        ) : null}
        <div className="border-t border-dashed border-app-ink/20" />
      </div>

      <section
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[calc(var(--space-6)+var(--safe-bottom))] [-webkit-overflow-scrolling:touch]"
        aria-label="재고 목록"
      >
        <IngredientListContainer
          query={query}
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
      </section>
    </main>
  );
}
