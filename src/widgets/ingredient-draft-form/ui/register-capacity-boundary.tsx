"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  DEFAULT_INGREDIENT_LIST_SORT,
  ingredientQueries,
  IngredientRefrigeratorRequiredState,
  type IngredientListQuery,
} from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

import {
  getRegisterCapacity,
  type RegisterCapacity,
} from "../model/register-capacity";

const CAPACITY_LIST_QUERY: IngredientListQuery = {
  filter: null,
  category: null,
  sort: DEFAULT_INGREDIENT_LIST_SORT,
};

type RegisterCapacityBoundaryProps = {
  children: (capacity: RegisterCapacity) => ReactNode;
};

export function RegisterCapacityBoundary({
  children,
}: RegisterCapacityBoundaryProps) {
  const refrigeratorId = useCurrentRefrigeratorId();
  const {
    data: page,
    isError,
    refetch,
  } = useQuery({
    ...ingredientQueries.firstPage(refrigeratorId ?? "", CAPACITY_LIST_QUERY),
    enabled: Boolean(refrigeratorId),
  });

  if (page) {
    return children(getRegisterCapacity(page));
  }

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      {refrigeratorId === null ? (
        <IngredientRefrigeratorRequiredState />
      ) : isError ? (
        <AsyncViewState
          status="error"
          title="재고를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요"
          action={
            <button
              type="button"
              onClick={() => void refetch()}
              className={asyncViewActionClassName}
            >
              다시 시도
            </button>
          }
        />
      ) : (
        <AsyncViewState status="loading" title="재고를 불러오는 중입니다" />
      )}
    </main>
  );
}
