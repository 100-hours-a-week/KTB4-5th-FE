"use client";

import { useController } from "react-hook-form";

import { IngredientWeightInput } from "@/features/ingredient-form";

import { type IngredientEditFormInput } from "../model/ingredient-edit-form-schema";

type EditWeightFieldProps = {
  id: string;
  describedBy: string;
};

export function EditWeightField({ id, describedBy }: EditWeightFieldProps) {
  const {
    field: { ref, name, value, onChange, onBlur },
    fieldState,
  } = useController<IngredientEditFormInput, "weightValue">({
    name: "weightValue",
  });
  const {
    field: {
      ref: unitRef,
      name: unitName,
      value: unitValue,
      onChange: onUnitChange,
      onBlur: onUnitBlur,
    },
  } = useController<IngredientEditFormInput, "weightUnit">({
    name: "weightUnit",
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
