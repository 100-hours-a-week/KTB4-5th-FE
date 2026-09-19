"use client";

import { type IngredientListQuery } from "@/entities/ingredient";
import { STOCK_TYPE_LIMIT } from "@/shared/config";

import { useIngredientListNavigation } from "../model/use-ingredient-list-navigation";
import { IngredientFilterSection } from "./ingredient-filter-section";
import { IngredientSortFilter } from "./ingredient-sort-filter";

type IngredientControlsContainerProps = {
  query: IngredientListQuery;
  filteredCount: number;
  ingredientsNum: number;
};

export function IngredientControlsContainer({
  filteredCount,
  ingredientsNum,
  query,
}: IngredientControlsContainerProps) {
  const updateQuery = useIngredientListNavigation(query);
  const remaining = Math.max(STOCK_TYPE_LIMIT - ingredientsNum, 0);
  const countText =
    query.filter === null
      ? `전체 ${ingredientsNum}종 · 잔여 ${remaining}종`
      : `총 ${filteredCount}종`;

  return (
    <div className="flex-none">
      <div className="px-5 pt-4">
        <IngredientFilterSection
          filter={query.filter}
          onFilterChange={(filter) => updateQuery({ filter })}
        />
      </div>

      <div className="flex items-center justify-between gap-3 px-5 pt-3">
        <p className="mb-0 min-w-0 truncate text-[12.5px] leading-tight text-app-ink/55">
          {countText}
        </p>
        <IngredientSortFilter
          sort={query.sort}
          onSortChange={(sort) => updateQuery({ sort })}
        />
      </div>
    </div>
  );
}
