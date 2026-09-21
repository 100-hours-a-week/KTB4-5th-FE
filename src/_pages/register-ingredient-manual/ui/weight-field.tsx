"use client";

import { useController } from "react-hook-form";

import { IngredientWeightInput } from "@/features/ingredient-form";

import { type ManualRegisterFormInput } from "../model/manual-register-form-schema";

type WeightFieldProps = {
  id: string;
  index: number;
  describedBy: string;
};

export function WeightField({ id, index, describedBy }: WeightFieldProps) {
  const {
    field: { ref, name, value, onChange, onBlur },
    fieldState,
  } = useController<ManualRegisterFormInput, `drafts.${number}.weightValue`>({
    name: `drafts.${index}.weightValue`,
  });
  const {
    field: {
      ref: unitRef,
      name: unitName,
      value: unitValue,
      onChange: onUnitChange,
      onBlur: onUnitBlur,
    },
  } = useController<ManualRegisterFormInput, `drafts.${number}.weightUnit`>({
    name: `drafts.${index}.weightUnit`,
  });

  return (
    <IngredientWeightInput
      id={id}
      inputRef={ref}
      name={name}
      value={value}
      onValueChange={onChange}
      onBlur={onBlur}
      invalid={Boolean(fieldState.error)}
      describedBy={describedBy}
      unitName={unitName}
      unitValue={unitValue}
      unitRef={unitRef}
      onUnitChange={onUnitChange}
      onUnitBlur={onUnitBlur}
    />
  );
}
