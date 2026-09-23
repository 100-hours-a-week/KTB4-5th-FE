"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";

import {
  ingredientQueries,
  REFRIGERATOR_ID,
  parseIngredientListQuery,
  type RawQueryParams,
} from "@/entities/ingredient";
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
  // TODO: 현재 냉장고 선택 상태가 연동되면 선택된 ID를 사용한다.
  const refrigeratorId = REFRIGERATOR_ID;
  const options = useMemo(
    () => ingredientQueries.list(refrigeratorId, query),
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
  const scrollContainerRef = useRef<HTMLElement>(null);

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
        {canDisposeExpired ? (
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
