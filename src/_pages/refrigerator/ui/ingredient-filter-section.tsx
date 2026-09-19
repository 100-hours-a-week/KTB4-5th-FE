"use client";

import {
  INGREDIENT_LIST_FILTER_LABELS,
  INGREDIENT_LIST_FILTERS,
  type IngredientListFilter,
} from "@/entities/ingredient";
import { FilterChip } from "@/shared/ui/filter-chip";

type IngredientFilterSectionProps = {
  filter: IngredientListFilter | null;
  onFilterChange: (filter: IngredientListFilter | null) => void;
};

export function IngredientFilterSection({
  filter,
  onFilterChange,
}: IngredientFilterSectionProps) {
  return (
    <div
      role="group"
      aria-label="재고 필터"
      className="flex items-center gap-1.5 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
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
  );
}
