"use client";

import { Pencil1Outlined } from "@lineiconshq/free-icons";
import { useQuery } from "@tanstack/react-query";

import {
  DEFAULT_INGREDIENT_LIST_SORT,
  ingredientQueries,
  type IngredientListQuery,
} from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { ApiError } from "@/shared/api";
import { routes } from "@/shared/routes";
import { AsyncViewState } from "@/shared/ui/async-view-state";

import { getRegisterCapacity } from "../model/register-capacity";
import { RegisterCapacityNotice } from "./register-capacity-notice";
import { RegisterMethodCard } from "./register-method-card";

const CAPACITY_LIST_QUERY: IngredientListQuery = {
  filter: null,
  sort: DEFAULT_INGREDIENT_LIST_SORT,
};

export function RegisterIngredientPage() {
  const refrigeratorId = useCurrentRefrigeratorId();
  const {
    data: page,
    error,
    refetch,
  } = useQuery({
    ...ingredientQueries.firstPage(refrigeratorId ?? "", CAPACITY_LIST_QUERY),
    enabled: Boolean(refrigeratorId),
  });
  const capacity = page ? getRegisterCapacity(page) : null;

  if (error && !page) {
    return (
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <AsyncViewState
          status="error"
          title={
            error instanceof ApiError
              ? error.problem.title || "보유 재고 수를 불러오지 못했어요"
              : "네트워크 연결을 확인해 주세요"
          }
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
      </main>
    );
  }

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-5 pt-6 pb-[calc(var(--space-6)+var(--safe-bottom))] [-webkit-overflow-scrolling:touch]">
      <h2
        id="register-method-heading"
        className="mb-5 text-[28px] text-app-ink"
      >
        어떻게 등록할까요?
      </h2>

      {capacity ? (
        <RegisterCapacityNotice capacity={capacity} />
      ) : (
        <p className="m-0 text-[13.5px] leading-snug text-app-ink/65">
          보유 재고 수를 확인하고 있어요
        </p>
      )}

      <ul className="mt-5" aria-labelledby="register-method-heading">
        <li>
          <RegisterMethodCard
            href={routes.registerIngredientManual}
            icon={Pencil1Outlined}
            title="직접 쓰기"
            description="재료 하나씩 정보를 직접 써요"
            disabled={capacity?.isLimitReached ?? false}
          />
        </li>
      </ul>
    </main>
  );
}
