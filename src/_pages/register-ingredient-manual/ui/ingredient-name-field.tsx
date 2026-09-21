"use client";

import { useController } from "react-hook-form";

import { IngredientNameInput } from "@/features/ingredient-form";

import type { ManualRegisterFormInput } from "../model/manual-register-form-schema";

type IngredientNameFieldProps = {
  id: string;
  index: number;
  describedBy: string;
};

export function IngredientNameField({
  id,
  index,
  describedBy,
}: IngredientNameFieldProps) {
  const {
    field: { ref, name, value, onChange, onBlur },
    fieldState,
  } = useController<ManualRegisterFormInput, `drafts.${number}.name`>({
    name: `drafts.${index}.name`,
  });

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
