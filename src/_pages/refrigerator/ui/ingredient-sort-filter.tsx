"use client";

import {
  INGREDIENT_LIST_SORT_LABELS,
  INGREDIENT_LIST_SORTS,
  type IngredientListSort,
} from "@/entities/ingredient";

type IngredientSortFilterProps = {
  sort: IngredientListSort;
  onSortChange: (sort: IngredientListSort) => void;
};

const SORT_SELECT_ID = "ingredient-sort";

export function IngredientSortFilter({
  onSortChange,
  sort,
}: IngredientSortFilterProps) {
  return (
    <span className="relative inline-flex flex-none items-center">
      <label htmlFor={SORT_SELECT_ID} className="sr-only">
        정렬 기준
      </label>
      <select
        id={SORT_SELECT_ID}
        value={sort}
        onChange={(event) =>
          onSortChange(event.target.value as IngredientListSort)
        }
        className="cursor-pointer appearance-none bg-transparent pr-3 text-[12.5px] font-bold text-app-ink outline-none hover:text-app-primary"
      >
        {INGREDIENT_LIST_SORTS.map((value) => (
          <option key={value} value={value}>
            {INGREDIENT_LIST_SORT_LABELS[value]}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 text-[10px] leading-none text-app-ink/45"
      >
        ▾
      </span>
    </span>
  );
}
