"use client";

import type { Ref } from "react";

import {
  INGREDIENT_WEIGHT_UNIT_LABELS,
  type IngredientWeightUnit,
} from "@/entities/ingredient";
import { INGREDIENT_WEIGHT_MAX, INGREDIENT_WEIGHT_MIN } from "@/shared/config";

import { sanitizeIntegerInput } from "../lib/sanitize-integer-input";

type IngredientWeightUnitOption = Exclude<IngredientWeightUnit, "NONE">;

interface IngredientWeightInputProps {
  id: string;
  name: string;
  value: string;
  describedBy: string;
  invalid: boolean;
  inputRef: Ref<HTMLInputElement>;
  onValueChange: (value: string) => void;
  onBlur: () => void;
  unitName: string;
  unitValue: IngredientWeightUnitOption;
  unitRef: Ref<HTMLSelectElement>;
  onUnitChange: (unit: IngredientWeightUnitOption) => void;
  onUnitBlur: () => void;
  unitDisabled?: boolean;
  disabled?: boolean;
}

const WEIGHT_UNITS = [
  "G",
  "ML",
] as const satisfies readonly IngredientWeightUnitOption[];
const WEIGHT_MAX_LENGTH = String(INGREDIENT_WEIGHT_MAX).length;

const CONTROL_BASE_CLASS_NAME =
  "flex h-10 w-full items-center gap-1.5 border-b-[1.5px] bg-transparent px-0.5 text-left";

const INPUT_CLASS_NAME =
  "min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-right font-app-mono text-[16px] font-bold leading-none text-app-ink outline-none placeholder:font-normal placeholder:text-app-ink/30 disabled:cursor-not-allowed disabled:text-app-ink/30";

const UNIT_CLASS_NAME =
  "-mr-1 flex-none cursor-pointer border-0 bg-transparent py-1 pr-0 pl-1 text-[13px] font-medium text-app-ink/70 outline-none disabled:cursor-not-allowed disabled:text-app-ink/30";

function getControlClassName(invalid: boolean, disabled: boolean) {
  if (disabled)
    return `${CONTROL_BASE_CLASS_NAME} border-app-ink/10 bg-app-ink/5`;
  return `${CONTROL_BASE_CLASS_NAME} ${
    invalid
      ? "border-app-primary"
      : "border-app-ink/25 focus-within:border-app-ink"
  }`;
}

export function IngredientWeightInput({
  id,
  name,
  value,
  describedBy,
  invalid,
  inputRef,
  onValueChange,
  onBlur,
  unitName,
  unitValue,
  unitRef,
  onUnitChange,
  onUnitBlur,
  unitDisabled = false,
  disabled = false,
}: IngredientWeightInputProps) {
  return (
    <div className={getControlClassName(invalid, disabled)}>
      <input
        disabled={disabled}
        id={id}
        ref={inputRef}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={WEIGHT_MAX_LENGTH}
        min={INGREDIENT_WEIGHT_MIN}
        max={INGREDIENT_WEIGHT_MAX}
        placeholder="선택"
        value={value}
        onChange={(event) =>
          onValueChange(
            sanitizeIntegerInput(event.target.value, WEIGHT_MAX_LENGTH),
          )
        }
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={INPUT_CLASS_NAME}
      />
      <select
        disabled={disabled || unitDisabled}
        ref={unitRef}
        aria-label="무게 단위"
        name={unitName}
        value={unitValue}
        onChange={(event) => {
          const nextUnit = WEIGHT_UNITS.find(
            (unit) => unit === event.target.value,
          );

          if (nextUnit !== undefined) {
            onUnitChange(nextUnit);
          }
        }}
        onBlur={onUnitBlur}
        className={UNIT_CLASS_NAME}
      >
        {WEIGHT_UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {INGREDIENT_WEIGHT_UNIT_LABELS[unit]}
          </option>
        ))}
      </select>
    </div>
  );
}
