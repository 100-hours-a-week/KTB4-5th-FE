"use client";

import {
  AppBottomSheet,
  AppBottomSheetTitle,
} from "@/shared/ui/app-bottom-sheet";
import { CheckMark } from "@/shared/ui/check-mark";

import {
  RECIPE_SORT_LABELS,
  RECIPE_SORTS,
  type RecipeSort,
} from "../model/recipe-sort";

type RecipeSortSheetProps = {
  open: boolean;
  sort: RecipeSort;
  onSortChange: (sort: RecipeSort) => void;
  onDismiss: () => void;
};

export function RecipeSortSheet({
  onDismiss,
  onSortChange,
  open,
  sort,
}: RecipeSortSheetProps) {
  return (
    <AppBottomSheet open={open} onDismiss={onDismiss}>
      <AppBottomSheetTitle className="m-0 font-app-heading text-[18px] font-black leading-tight">
        정렬 기준
      </AppBottomSheetTitle>
      <fieldset className="mt-2 border-0 p-0">
        <legend className="sr-only">정렬 기준</legend>
        {RECIPE_SORTS.map((value) => (
          <label
            key={value}
            className="flex cursor-pointer items-center justify-between gap-3 border-app-neutral-200 py-3.5 text-[15px] font-bold text-app-ink [&+&]:border-t"
          >
            {RECIPE_SORT_LABELS[value]}
            <input
              type="radio"
              name="recipe-sort"
              value={value}
              checked={sort === value}
              onChange={() => onSortChange(value)}
              className="peer sr-only"
            />
            <CheckMark />
          </label>
        ))}
      </fieldset>
    </AppBottomSheet>
  );
}
