"use client";

import type { Ref } from "react";

import { INGREDIENT_QUANTITY_UNIT } from "@/entities/ingredient";
import {
  INGREDIENT_QUANTITY_MAX,
  INGREDIENT_QUANTITY_MIN,
} from "@/shared/config";

import { sanitizeIntegerInput } from "../lib/sanitize-integer-input";

interface IngredientQuantityInputProps {
  id: string;
  name: string;
  value: string;
  describedBy: string;
  invalid: boolean;
  inputRef: Ref<HTMLInputElement>;
  onValueChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
}

const QUANTITY_MAX_LENGTH = String(INGREDIENT_QUANTITY_MAX).length;

const CONTROL_BASE_CLASS_NAME =
  "flex h-10 w-full items-center gap-1.5 border-b-[1.5px] bg-transparent px-0.5 text-left";

const INPUT_CLASS_NAME =
  "min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-right font-app-mono text-[16px] font-bold leading-none text-app-ink outline-none placeholder:font-normal placeholder:text-app-ink/30 disabled:cursor-not-allowed disabled:text-app-ink/30";

const UNIT_CLASS_NAME =
  "flex-none font-app-body text-[12.5px] font-medium text-app-ink/55";

function getControlClassName(invalid: boolean, disabled: boolean) {
  if (disabled)
    return `${CONTROL_BASE_CLASS_NAME} border-app-ink/10 bg-app-ink/5`;
  return `${CONTROL_BASE_CLASS_NAME} ${
    invalid
      ? "border-app-primary"
      : "border-app-ink/25 focus-within:border-app-ink"
  }`;
}

export function IngredientQuantityInput({
  id,
  name,
  value,
  describedBy,
  invalid,
  inputRef,
  onValueChange,
  onBlur,
  disabled = false,
}: IngredientQuantityInputProps) {
  return (
    <div className={getControlClassName(invalid, disabled)}>
      <input
        disabled={disabled}
        id={id}
        ref={inputRef}
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
          onValueChange(
            sanitizeIntegerInput(event.target.value, QUANTITY_MAX_LENGTH),
          )
        }
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={INPUT_CLASS_NAME}
      />
      <span className={UNIT_CLASS_NAME}>{INGREDIENT_QUANTITY_UNIT}</span>
    </div>
  );
}
