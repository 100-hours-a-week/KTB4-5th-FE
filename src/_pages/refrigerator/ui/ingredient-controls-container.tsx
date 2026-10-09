"use client";

import { type IngredientListQuery } from "@/entities/ingredient";

import { useIngredientListNavigation } from "../model/use-ingredient-list-navigation";
import { IngredientFilterSection } from "./ingredient-filter-section";
import { IngredientSortFilter } from "./ingredient-sort-filter";

type IngredientControlsContainerProps = {
  query: IngredientListQuery;
  filteredCount: number;
  isLoading: boolean;
};

export function IngredientControlsContainer({
  filteredCount,
  isLoading,
  query,
}: IngredientControlsContainerProps) {
  const updateQuery = useIngredientListNavigation(query);
  const countText = isLoading ? "재고 조회 중" : `총 ${filteredCount}종`;

  return (
    <div className="flex-none">
      <div className="px-5 pt-4">
        <IngredientFilterSection
          filter={query.filter}
          category={query.category}
          onFilterChange={(filter) => updateQuery({ filter })}
          onCategoryChange={(category) => updateQuery({ category })}
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
