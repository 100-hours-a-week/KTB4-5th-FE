"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  IngredientReadErrorState,
  IngredientRefrigeratorRequiredState,
  ingredientQueries,
} from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { useRetryControl } from "@/shared/lib/use-retry-control";
import { AsyncViewState } from "@/shared/ui/async-view-state";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { IngredientDetailActions } from "./ingredient-detail-actions";
import { IngredientMemoNote } from "./ingredient-memo-note";
import { IngredientSummaryCard } from "./ingredient-summary-card";

type IngredientDetailPageProps = {
  ingredientId: string;
};

function DetailStateLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      {children}
    </main>
  );
}

export function IngredientDetailPage({
  ingredientId,
}: IngredientDetailPageProps) {
  const refrigeratorId = useCurrentRefrigeratorId();
  const { data, error, isPending, isError, isFetching, refetch } = useQuery({
    ...ingredientQueries.detail(refrigeratorId ?? "", ingredientId),
    enabled: Boolean(refrigeratorId),
  });
  const retryControl = useRetryControl();

  if (!refrigeratorId) {
    return (
      <DetailStateLayout>
        <IngredientRefrigeratorRequiredState />
      </DetailStateLayout>
    );
  }

  const retryingError = retryControl.retryingError;

  if (retryingError !== null || isError) {
    return (
      <DetailStateLayout>
        <IngredientReadErrorState
          error={retryingError?.error ?? error}
          resource="detail"
          isFetching={retryingError !== null || isFetching}
          failureCount={retryControl.failureCount}
          cooldownSeconds={retryControl.cooldownSeconds}
          onRetry={() => void retryControl.retry(error, refetch)}
        />
      </DetailStateLayout>
    );
  }

  if (isPending) {
    return (
      <DetailStateLayout>
        <AsyncViewState status="loading" title="재고를 불러오는 중입니다" />
      </DetailStateLayout>
    );
  }

  const { ingredient, etag } = data;

  return (
    <PageActionLayout
      action={
        <IngredientDetailActions
          ingredient={ingredient}
          etag={etag}
          refrigeratorId={refrigeratorId}
        />
      }
    >
      <IngredientSummaryCard ingredient={ingredient} />
      <IngredientMemoNote status={ingredient.status} />
    </PageActionLayout>
  );
}
