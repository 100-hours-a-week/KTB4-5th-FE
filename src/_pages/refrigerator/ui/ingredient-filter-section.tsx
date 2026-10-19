"use client";

import {
  INGREDIENT_CATEGORIES,
  INGREDIENT_CATEGORY_LABELS,
  INGREDIENT_LIST_FILTER_LABELS,
  INGREDIENT_LIST_FILTERS,
  type IngredientCategory,
  type IngredientListFilter,
} from "@/entities/ingredient";
import { ChipScrollRow } from "@/shared/ui/chip-scroll-row";
import { FilterChip } from "@/shared/ui/filter-chip";

type IngredientFilterSectionProps = {
  filter: IngredientListFilter | null;
  category: IngredientCategory | null;
  onFilterChange: (filter: IngredientListFilter | null) => void;
  onCategoryChange: (category: IngredientCategory | null) => void;
  onFilterIntent: (filter: IngredientListFilter | null) => void;
  onCategoryIntent: (category: IngredientCategory | null) => void;
};

export function IngredientFilterSection({
  filter,
  category,
  onFilterChange,
  onCategoryChange,
  onFilterIntent,
  onCategoryIntent,
}: IngredientFilterSectionProps) {
  return (
    <div className="flex flex-col">
      <ChipScrollRow aria-label="재고 필터">
        <FilterChip
          selected={filter === null}
          onPointerDown={() => onFilterIntent(null)}
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
            onPointerDown={() => onFilterIntent(value)}
            onClick={() => {
              if (filter !== value) onFilterChange(value);
            }}
          >
            {INGREDIENT_LIST_FILTER_LABELS[value]}
          </FilterChip>
        ))}
      </ChipScrollRow>

      <ChipScrollRow aria-label="카테고리 필터">
        <FilterChip
          selected={category === null}
          onPointerDown={() => onCategoryIntent(null)}
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
            onPointerDown={() => onCategoryIntent(value)}
            onClick={() => {
              if (category !== value) onCategoryChange(value);
            }}
          >
            {INGREDIENT_CATEGORY_LABELS[value]}
          </FilterChip>
        ))}
      </ChipScrollRow>
    </div>
  );
}
