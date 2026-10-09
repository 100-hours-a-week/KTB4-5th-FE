"use client";

import {
  INGREDIENT_CATEGORIES,
  INGREDIENT_CATEGORY_LABELS,
  INGREDIENT_LIST_FILTER_LABELS,
  INGREDIENT_LIST_FILTERS,
  type IngredientCategory,
  type IngredientListFilter,
} from "@/entities/ingredient";
import { FilterChip } from "@/shared/ui/filter-chip";

type IngredientFilterSectionProps = {
  filter: IngredientListFilter | null;
  category: IngredientCategory | null;
  onFilterChange: (filter: IngredientListFilter | null) => void;
  onCategoryChange: (category: IngredientCategory | null) => void;
};

const ROW_CLASS_NAME =
  "flex items-center gap-1.5 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function IngredientFilterSection({
  filter,
  category,
  onFilterChange,
  onCategoryChange,
}: IngredientFilterSectionProps) {
  return (
    <div className="flex flex-col">
      <div role="group" aria-label="재고 필터" className={ROW_CLASS_NAME}>
        <FilterChip
          selected={filter === null}
          onClick={() => {
            if (filter !== null) onFilterChange(null);
          }}
        >
          전체
        </FilterChip>
        {INGREDIENT_LIST_FILTERS.map((value) => (
          <FilterChip
            key={value}
            selected={filter === value}
            tone={value === "EXPIRED" ? "primary" : "ink"}
            onClick={() => {
              if (filter !== value) onFilterChange(value);
            }}
          >
            {INGREDIENT_LIST_FILTER_LABELS[value]}
          </FilterChip>
        ))}
      </div>

      <div role="group" aria-label="카테고리 필터" className={ROW_CLASS_NAME}>
        <FilterChip
          selected={category === null}
          onClick={() => {
            if (category !== null) onCategoryChange(null);
          }}
        >
          전체
        </FilterChip>
        {INGREDIENT_CATEGORIES.map((value) => (
          <FilterChip
            key={value}
            selected={category === value}
            onClick={() => {
              if (category !== value) onCategoryChange(value);
            }}
          >
            {INGREDIENT_CATEGORY_LABELS[value]}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}
