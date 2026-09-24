"use client";

import { useController } from "react-hook-form";

import { IngredientQuantityInput } from "@/features/ingredient-form";

import type { ManualRegisterFormInput } from "../model/manual-register-form-schema";

type QuantityFieldProps = {
  id: string;
  index: number;
  describedBy: string;
  disabled: boolean;
};

export function QuantityField({
  id,
  index,
  describedBy,
  disabled,
}: QuantityFieldProps) {
  const {
    field: { ref, name, value, onChange, onBlur },
    fieldState,
  } = useController<ManualRegisterFormInput, `drafts.${number}.quantity`>({
    name: `drafts.${index}.quantity`,
  });

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
      disabled={disabled}
    />
  );
}
