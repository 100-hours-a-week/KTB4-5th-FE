"use client";

import type { RefObject } from "react";

import {
  hasIngredientListCondition,
  type Ingredient,
  type IngredientListQuery,
} from "@/entities/ingredient";
import { ApiError } from "@/shared/api";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

import { useIngredientListNavigation } from "../model/use-ingredient-list-navigation";
import { useInfiniteScrollTrigger } from "../model/use-infinite-scroll-trigger";
import { IngredientCardList } from "./ingredient-card-list";
import { IngredientListEmpty } from "./ingredient-list-empty";

type IngredientListContainerProps = {
  query: IngredientListQuery;
  ingredients: Ingredient[];
  scrollContainerRef: RefObject<HTMLElement | null>;
  isPending: boolean;
  isInitialError: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  hasNextPage: boolean;
  onFetchNextPage: () => Promise<unknown>;
  onRetry: () => void;
  error: Error | null;
};

export function IngredientListContainer({
  ingredients,
  query,
  scrollContainerRef,
  isPending,
  isInitialError,
  isFetchingNextPage,
  isFetchNextPageError,
  hasNextPage,
  onFetchNextPage,
  onRetry,
  error,
}: IngredientListContainerProps) {
  const updateQuery = useIngredientListNavigation(query);
  const infiniteScrollTriggerRef = useInfiniteScrollTrigger({
    rootRef: scrollContainerRef,
    enabled: hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
    onLoadMore: onFetchNextPage,
  });

  if (isPending) {
    return <AsyncViewState status="loading" title="재고를 불러오는 중입니다" />;
  }

  if (isInitialError) {
    const title =
      error instanceof ApiError
        ? error.problem.title || "재고를 불러오지 못했어요"
        : "네트워크 연결을 확인해 주세요";

    return (
      <AsyncViewState
        status="error"
        title={title}
        description="잠시 후 다시 시도해 주세요"
        action={
          <button
            type="button"
            onClick={onRetry}
            className={asyncViewActionClassName}
          >
            다시 시도
          </button>
        }
      />
    );
  }

  if (ingredients.length === 0) {
    return (
      <IngredientListEmpty
        hasCondition={hasIngredientListCondition(query)}
        onResetCondition={() => updateQuery({ filter: null })}
      />
    );
  }

  return (
    <>
      <IngredientCardList ingredients={ingredients} />
      <div ref={infiniteScrollTriggerRef} aria-hidden="true" className="h-px" />
      {isFetchingNextPage ? (
        <p role="status" className="py-4 text-center text-sm text-app-ink/55">
          재고를 더 불러오는 중입니다
        </p>
      ) : null}
      {isFetchNextPageError ? (
        <div className="py-4 text-center">
          <p className="text-sm text-app-ink/55">
            {error instanceof ApiError
              ? error.problem.title || "다음 재고를 불러오지 못했어요"
              : "네트워크 연결을 확인해 주세요"}
          </p>
          <button
            type="button"
            onClick={() => void onFetchNextPage()}
            className="mt-2 rounded-full bg-app-ink px-5 py-2 text-sm font-bold text-app-canvas"
          >
            다시 시도
          </button>
        </div>
      ) : null}
    </>
  );
}
