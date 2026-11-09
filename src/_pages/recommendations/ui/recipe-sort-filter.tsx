"use client";

import {
  RECIPE_SORT_LABELS,
  RECIPE_SORTS,
  type RecipeSort,
} from "../model/recipe-sort";

type RecipeSortFilterProps = {
  sort: RecipeSort;
  onSortChange: (sort: RecipeSort) => void;
};

const SORT_SELECT_ID = "recipe-sort";

export function RecipeSortFilter({
  onSortChange,
  sort,
}: RecipeSortFilterProps) {
  return (
    <span className="relative inline-flex flex-none items-center">
      <label htmlFor={SORT_SELECT_ID} className="sr-only">
        정렬 기준
      </label>
      <select
        id={SORT_SELECT_ID}
        value={sort}
        onChange={(event) => onSortChange(event.target.value as RecipeSort)}
        className="cursor-pointer appearance-none bg-transparent pr-3 text-[12.5px] font-bold text-app-ink outline-none hover:text-app-primary"
      >
        {RECIPE_SORTS.map((value) => (
          <option key={value} value={value}>
            {RECIPE_SORT_LABELS[value]}
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
