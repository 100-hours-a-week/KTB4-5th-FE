"use client";

import { useController } from "react-hook-form";

import { IngredientStorageTypeField } from "@/features/ingredient-form";

import type { IngredientDraftFormInput } from "../model/ingredient-draft-form-schema";

type StorageTypeFieldProps = {
  index: number;
};

export function StorageTypeField({ index }: StorageTypeFieldProps) {
  const {
    field: { ref, name, value, onChange, onBlur },
  } = useController<IngredientDraftFormInput, `drafts.${number}.storageType`>({
    name: `drafts.${index}.storageType`,
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
