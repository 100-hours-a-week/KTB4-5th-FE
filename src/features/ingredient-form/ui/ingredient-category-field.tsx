"use client";

import type { Ref } from "react";

import {
  INGREDIENT_CATEGORIES,
  INGREDIENT_CATEGORY_LABELS,
  type IngredientCategory,
} from "@/entities/ingredient";

interface IngredientCategoryFieldProps {
  id: string;
  name: string;
  value: IngredientCategory;
  inputRef: Ref<HTMLSelectElement>;
  onValueChange: (value: IngredientCategory) => void;
  onBlur: () => void;
}

export function IngredientCategoryField({
  id,
  name,
  value,
  inputRef,
  onValueChange,
  onBlur,
}: IngredientCategoryFieldProps) {
  return (
    <select
      id={id}
      ref={inputRef}
      name={name}
      value={value}
      onChange={(event) => {
        const next = INGREDIENT_CATEGORIES.find(
          (category) => category === event.target.value,
        );

        if (next !== undefined) {
          onValueChange(next);
        }
      }}
      onBlur={onBlur}
      className="h-10 w-full cursor-pointer border-0 border-b-[1.5px] border-app-ink/25 bg-transparent px-0.5 font-app-body text-[15px] font-bold text-app-ink outline-none focus:border-app-ink"
    >
      {INGREDIENT_CATEGORIES.map((category) => (
        <option key={category} value={category}>
          {INGREDIENT_CATEGORY_LABELS[category]}
        </option>
      ))}
    </select>
  );
}
