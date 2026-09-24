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

import { toIngredientEditTarget } from "../model/ingredient-edit-target";
import { IngredientEditForm } from "./ingredient-edit-form";

type IngredientEditPageProps = { ingredientId: string };

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
  const retry = useRetryControl();

  if (refrigeratorId == null) {
    return (
      <EditStateLayout>
        <IngredientRefrigeratorRequiredState />
      </EditStateLayout>
    );
  }

  if (retry.retryingError !== null || detailQuery.isError) {
    return (
      <EditStateLayout>
        <IngredientReadErrorState
          error={retry.retryingError?.error ?? detailQuery.error}
          resource="detail"
          isFetching={retry.retryingError !== null || detailQuery.isFetching}
          failureCount={retry.failureCount}
          cooldownSeconds={retry.cooldownSeconds}
          onRetry={() =>
            void retry.retry(detailQuery.error, detailQuery.refetch)
          }
        />
      </EditStateLayout>
    );
  }

  if (detailQuery.isPending) {
    return (
      <EditStateLayout>
        <AsyncViewState status="loading" title="재고를 불러오는 중입니다" />
      </EditStateLayout>
    );
  }

  return (
    <IngredientEditForm
      key={detailQuery.data.etag ?? ingredientId}
      target={toIngredientEditTarget(detailQuery.data)}
      refrigeratorId={refrigeratorId}
    />
  );
}
