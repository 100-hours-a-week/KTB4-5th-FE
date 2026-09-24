"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  DEFAULT_INGREDIENT_LIST_SORT,
  IngredientReadErrorState,
  IngredientRefrigeratorRequiredState,
  ingredientQueries,
  type IngredientListQuery,
} from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { useRetryControl } from "@/shared/lib/use-retry-control";
import { AsyncViewState } from "@/shared/ui/async-view-state";

import { toIngredientEditTarget } from "../model/ingredient-edit-target";
import { IngredientEditForm } from "./ingredient-edit-form";

const MERGE_CANDIDATE_LIST_QUERY: IngredientListQuery = {
  filter: null,
  sort: DEFAULT_INGREDIENT_LIST_SORT,
};

type IngredientEditPageProps = {
  ingredientId: string;
};

function EditStateLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      {children}
    </main>
  );
}

export function IngredientEditPage({ ingredientId }: IngredientEditPageProps) {
  const refrigeratorId = useCurrentRefrigeratorId();
  const detailQuery = useQuery({
    ...ingredientQueries.detail(refrigeratorId ?? "", ingredientId),
    enabled: Boolean(refrigeratorId),
  });
  const listQuery = useQuery({
    ...ingredientQueries.allPages(
      refrigeratorId ?? "",
      MERGE_CANDIDATE_LIST_QUERY,
    ),
    enabled: Boolean(refrigeratorId),
  });
  const detailRetry = useRetryControl();
  const listRetry = useRetryControl();

  if (refrigeratorId === null) {
    return (
      <EditStateLayout>
        <IngredientRefrigeratorRequiredState />
      </EditStateLayout>
    );
  }

  if (detailRetry.retryingError !== null || listRetry.retryingError !== null) {
    const isDetailRetry = detailRetry.retryingError !== null;
    const retryControl = isDetailRetry ? detailRetry : listRetry;
    const failedQuery = isDetailRetry ? detailQuery : listQuery;

    return (
      <EditStateLayout>
        <IngredientReadErrorState
          error={retryControl.retryingError?.error}
          resource={isDetailRetry ? "detail" : "list"}
          isFetching
          failureCount={retryControl.failureCount}
          cooldownSeconds={retryControl.cooldownSeconds}
          onRetry={() =>
            void retryControl.retry(failedQuery.error, failedQuery.refetch)
          }
        />
      </EditStateLayout>
    );
  }

  if (detailQuery.isPending || listQuery.isPending) {
    return (
      <EditStateLayout>
        <AsyncViewState status="loading" title="재고를 불러오는 중입니다" />
      </EditStateLayout>
    );
  }

  if (detailQuery.isError || listQuery.isError) {
    const isDetailError = detailQuery.isError;
    const failedQuery = isDetailError ? detailQuery : listQuery;
    const retryControl = isDetailError ? detailRetry : listRetry;

    return (
      <EditStateLayout>
        <IngredientReadErrorState
          error={failedQuery.error}
          resource={isDetailError ? "detail" : "list"}
          isFetching={failedQuery.isFetching}
          failureCount={retryControl.failureCount}
          cooldownSeconds={retryControl.cooldownSeconds}
          onRetry={() =>
            void retryControl.retry(failedQuery.error, failedQuery.refetch)
          }
        />
      </EditStateLayout>
    );
  }

  return (
    <IngredientEditForm
      target={toIngredientEditTarget(
        detailQuery.data.ingredient,
        listQuery.data,
      )}
    />
  );
}
