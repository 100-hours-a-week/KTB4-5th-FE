"use client";

import {
  INGREDIENT_LIST_FILTER_LABELS,
  type IngredientListQuery,
} from "@/entities/ingredient";

import { useIngredientListNavigation } from "../model/use-ingredient-list-navigation";
import { IngredientFilterSection } from "./ingredient-filter-section";
import { IngredientSortFilter } from "./ingredient-sort-filter";

type IngredientControlsContainerProps = {
  query: IngredientListQuery;
  filteredCount: number;
};

export function IngredientControlsContainer({
  filteredCount,
  query,
}: IngredientControlsContainerProps) {
  const updateQuery = useIngredientListNavigation(query);
  const filterLabel =
    query.filter === null
      ? "전체"
      : INGREDIENT_LIST_FILTER_LABELS[query.filter];

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
          {filterLabel} {filteredCount}개
        </p>
        <IngredientSortFilter
          sort={query.sort}
          onSortChange={(sort) => updateQuery({ sort })}
        />
      </div>
    </div>
  );
}
