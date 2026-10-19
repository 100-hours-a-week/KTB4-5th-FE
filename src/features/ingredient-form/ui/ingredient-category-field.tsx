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
  value: IngredientCategory | "";
  inputRef: Ref<HTMLSelectElement>;
  onValueChange: (value: IngredientCategory) => void;
  onBlur: () => void;
  invalid?: boolean;
  describedBy?: string;
}

export function IngredientCategoryField({
  id,
  name,
  value,
  inputRef,
  onValueChange,
  onBlur,
  invalid = false,
  describedBy,
}: IngredientCategoryFieldProps) {
  return (
    <select
      id={id}
      ref={inputRef}
      name={name}
      value={value}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      onChange={(event) => {
        const next = INGREDIENT_CATEGORIES.find(
          (category) => category === event.target.value,
        );

        if (next !== undefined) {
          onValueChange(next);
        }
      }}
      onBlur={onBlur}
      className={`h-10 w-full cursor-pointer border-0 border-b-[1.5px] bg-transparent px-0.5 font-app-body text-[15px] font-bold outline-none focus:border-app-ink ${
        invalid ? "border-app-primary" : "border-app-ink/25"
      } ${value === "" ? "text-app-ink/35" : "text-app-ink"}`}
    >
      {value === "" ? (
        <option value="" disabled>
          카테고리 선택
        </option>
      ) : null}
      {INGREDIENT_CATEGORIES.map((category) => (
        <option key={category} value={category}>
          {INGREDIENT_CATEGORY_LABELS[category]}
        </option>
      ))}
    </select>
  );
}
