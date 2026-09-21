"use client";

import { useController } from "react-hook-form";

import { IngredientStorageTypeField } from "@/features/ingredient-form";

import type { IngredientEditFormInput } from "../model/ingredient-edit-form-schema";

export function EditStorageTypeField() {
  const {
    field: { ref, name, value, onChange, onBlur },
  } = useController<IngredientEditFormInput, "storageType">({
    name: "storageType",
  });

  return (
    <IngredientStorageTypeField
      inputRef={ref}
      name={name}
      value={value}
      onValueChange={onChange}
      onBlur={onBlur}
    />
  );
}
