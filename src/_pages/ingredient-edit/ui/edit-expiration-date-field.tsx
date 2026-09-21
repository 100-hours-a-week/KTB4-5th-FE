"use client";

import { useController } from "react-hook-form";

import { IngredientExpirationDateInput } from "@/features/select-expiration-date";

import type { IngredientEditFormInput } from "../model/ingredient-edit-form-schema";

type EditExpirationDateFieldProps = {
  id: string;
  labelId: string;
  describedBy: string;
};

// 직접 타이핑을 막기 위해 입력칸을 두지 않고 캘린더로만 값을 받는다.
export function EditExpirationDateField({
  id,
  labelId,
  describedBy,
}: EditExpirationDateFieldProps) {
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController<IngredientEditFormInput, "expirationDate">({
    name: "expirationDate",
  });

  return (
    <IngredientExpirationDateInput
      id={id}
      labelId={labelId}
      inputRef={ref}
      value={value}
      onValueChange={onChange}
      onBlur={onBlur}
      invalid={Boolean(fieldState.error)}
      describedBy={describedBy}
    />
  );
}
