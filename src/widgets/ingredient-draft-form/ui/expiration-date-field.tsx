"use client";

import { useController } from "react-hook-form";

import { IngredientExpirationDateInput } from "@/features/select-expiration-date";

import type { IngredientDraftFormInput } from "../model/ingredient-draft-form-schema";

type ExpirationDateFieldProps = {
  id: string;
  labelId: string;
  index: number;
  describedBy: string;
};

export function ExpirationDateField({
  id,
  labelId,
  index,
  describedBy,
}: ExpirationDateFieldProps) {
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController<
    IngredientDraftFormInput,
    `drafts.${number}.expirationDate`
  >({
    name: `drafts.${index}.expirationDate`,
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
