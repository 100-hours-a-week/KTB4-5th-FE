"use client";

import { useController } from "react-hook-form";

import { IngredientNameInput } from "@/features/ingredient-form";

import type { IngredientEditFormInput } from "../model/ingredient-edit-form-schema";

type EditNameFieldProps = {
  id: string;
  describedBy: string;
};

export function EditNameField({ id, describedBy }: EditNameFieldProps) {
  const {
    field: { ref, name, value, onChange, onBlur },
    fieldState,
  } = useController<IngredientEditFormInput, "name">({ name: "name" });

  return (
    <IngredientNameInput
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
