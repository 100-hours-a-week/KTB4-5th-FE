"use client";

import { useController } from "react-hook-form";

import { IngredientExpirationDateInput } from "@/features/select-expiration-date";

import type { ManualRegisterFormInput } from "../model/manual-register-form-schema";

type ExpirationDateFieldProps = {
  id: string;
  labelId: string;
  index: number;
  describedBy: string;
};

// 직접 타이핑을 막기 위해 입력칸을 두지 않고 캘린더로만 값을 받는다.
export function ExpirationDateField({
  id,
  labelId,
  index,
  describedBy,
}: ExpirationDateFieldProps) {
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController<ManualRegisterFormInput, `drafts.${number}.expirationDate`>(
    {
      name: `drafts.${index}.expirationDate`,
    },
  );

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
