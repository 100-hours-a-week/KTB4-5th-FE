"use client";

import { useController } from "react-hook-form";

import { INGREDIENT_QUANTITY_UNIT } from "@/entities/ingredient";
import {
  INGREDIENT_QUANTITY_MAX,
  INGREDIENT_QUANTITY_MIN,
} from "@/shared/config";

import { sanitizeIntegerInput } from "../lib/edit-input";
import type { IngredientEditFormInput } from "../model/ingredient-edit-form-schema";
import {
  FIELD_INPUT_CLASS_NAME,
  FIELD_UNIT_CLASS_NAME,
  getFieldControlClassName,
} from "./field-styles";

type EditQuantityFieldProps = {
  id: string;
  describedBy: string;
};

const QUANTITY_MAX_LENGTH = String(INGREDIENT_QUANTITY_MAX).length;

export function EditQuantityField({ id, describedBy }: EditQuantityFieldProps) {
  const {
    field: { ref, name, value, onChange, onBlur },
    fieldState,
  } = useController<IngredientEditFormInput, "quantity">({ name: "quantity" });

  return (
    <div className={getFieldControlClassName(Boolean(fieldState.error))}>
      <input
        id={id}
        ref={ref}
        name={name}
        type="text"
        // 숫자 키패드만 띄우고 소수점·부호는 입력 필터에서 막는다.
        inputMode="numeric"
        autoComplete="off"
        maxLength={QUANTITY_MAX_LENGTH}
        min={INGREDIENT_QUANTITY_MIN}
        max={INGREDIENT_QUANTITY_MAX}
        placeholder="0"
        value={value}
        onChange={(event) =>
          onChange(
            sanitizeIntegerInput(event.target.value, QUANTITY_MAX_LENGTH),
          )
        }
        onBlur={onBlur}
        aria-invalid={fieldState.error ? true : undefined}
        aria-describedby={describedBy}
        className={`${FIELD_INPUT_CLASS_NAME} text-right`}
      />
      <span className={FIELD_UNIT_CLASS_NAME}>{INGREDIENT_QUANTITY_UNIT}</span>
    </div>
  );
}
