"use client";

import { useController } from "react-hook-form";

import { IngredientCategoryField } from "@/features/ingredient-form";

import type { IngredientDraftFormInput } from "../model/ingredient-draft-form-schema";

type CategoryFieldProps = {
  id: string;
  index: number;
};

export function CategoryField({ id, index }: CategoryFieldProps) {
  const {
    field: { ref, name, value, onChange, onBlur },
  } = useController<IngredientDraftFormInput, `drafts.${number}.category`>({
    name: `drafts.${index}.category`,
  });

  return (
    <IngredientCategoryField
      id={id}
      inputRef={ref}
      name={name}
      value={value}
      onValueChange={onChange}
      onBlur={onBlur}
    />
  );
}
