"use client";

import { useController } from "react-hook-form";

import { IngredientQuantityInput } from "@/features/ingredient-form";

import type { IngredientEditFormInput } from "../model/ingredient-edit-form-schema";

type EditQuantityFieldProps = {
  id: string;
  describedBy: string;
};

export function EditQuantityField({ id, describedBy }: EditQuantityFieldProps) {
  const {
    field: { ref, name, value, onChange, onBlur },
    fieldState,
  } = useController<IngredientEditFormInput, "quantity">({ name: "quantity" });

  return (
    <IngredientQuantityInput
      id={id}
      inputRef={ref}
      name={name}
      value={value}
      onValueChange={onChange}
      onBlur={onBlur}
      invalid={Boolean(fieldState.error)}
      describedBy={describedBy}
    />
  );
}
