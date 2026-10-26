"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  IngredientReadErrorState,
  IngredientRefrigeratorRequiredState,
  ingredientQueries,
  useIngredientDateStale,
} from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { useRetryControl } from "@/shared/lib/use-retry-control";
import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

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
    refetchOnWindowFocus: false,
  });
  const retry = useRetryControl();
  const isDateStale = useIngredientDateStale(detailQuery.data?.baseDate);

  if (refrigeratorId === null) {
    return (
      <EditStateLayout>
        <IngredientRefrigeratorRequiredState />
      </EditStateLayout>
    );
  }

  if (refrigeratorId === undefined) {
    return (
      <EditStateLayout>
        <AsyncViewState status="loading" title="재고를 불러오는 중입니다" />
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

  if (detailQuery.isPending || !detailQuery.isFetchedAfterMount) {
    return (
      <EditStateLayout>
        <AsyncViewState status="loading" title="재고를 불러오는 중입니다" />
      </EditStateLayout>
    );
  }

  if (detailQuery.data.ingredient.status === "EXPIRED") {
    return (
      <EditStateLayout>
        <AsyncViewState
          status="empty"
          title="만료된 재고는 수정할 수 없어요"
          description="상세 화면에서 폐기 처리해 주세요"
          action={
            <AppLink
              href={routes.ingredientDetail(ingredientId)}
              className={asyncViewActionClassName}
            >
              상세로 돌아가기
            </AppLink>
          }
        />
      </EditStateLayout>
    );
  }

  return (
    <IngredientEditForm
      key={detailQuery.data.etag ?? ingredientId}
      target={toIngredientEditTarget(detailQuery.data)}
      refrigeratorId={refrigeratorId}
      isDateStale={isDateStale}
    />
  );
}
