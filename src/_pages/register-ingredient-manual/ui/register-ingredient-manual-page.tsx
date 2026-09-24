"use client";

import { useQuery } from "@tanstack/react-query";

import {
  DEFAULT_INGREDIENT_LIST_SORT,
  ingredientQueries,
  type IngredientListQuery,
} from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { AsyncViewState } from "@/shared/ui/async-view-state";

import { getRegisterCapacity } from "../model/register-capacity";
import { ManualRegisterForm } from "./manual-register-form";

const CAPACITY_LIST_QUERY: IngredientListQuery = {
  filter: null,
  sort: DEFAULT_INGREDIENT_LIST_SORT,
};

export function RegisterIngredientManualPage() {
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
    return <ManualRegisterForm capacity={getRegisterCapacity(page)} />;
  }

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      {isError ? (
        <AsyncViewState
          status="error"
          title="재고를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요"
          action={
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-full bg-app-ink px-6 py-3 text-sm font-bold text-app-canvas"
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
