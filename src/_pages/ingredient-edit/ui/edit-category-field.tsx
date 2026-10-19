"use client";

import { useController } from "react-hook-form";

import { IngredientCategoryField } from "@/features/ingredient-form";

import type { IngredientEditFormInput } from "../model/ingredient-edit-form-schema";

type EditCategoryFieldProps = {
  id: string;
};

export function EditCategoryField({ id }: EditCategoryFieldProps) {
  const {
    field: { ref, name, value, onChange, onBlur },
  } = useController<IngredientEditFormInput, "category">({
    name: "category",
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
