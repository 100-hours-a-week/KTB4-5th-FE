"use client";

import { useController, useFormContext } from "react-hook-form";

import { INGREDIENT_WEIGHT_UNIT_LABELS } from "@/entities/ingredient";
import { INGREDIENT_WEIGHT_MAX, INGREDIENT_WEIGHT_MIN } from "@/shared/config";

import { sanitizeIntegerInput } from "../lib/edit-input";
import {
  EDIT_WEIGHT_UNITS,
  type IngredientEditFormInput,
} from "../model/ingredient-edit-form-schema";
import {
  FIELD_INPUT_CLASS_NAME,
  getFieldControlClassName,
} from "./field-styles";

type EditWeightFieldProps = {
  id: string;
  describedBy: string;
};

const WEIGHT_MAX_LENGTH = String(INGREDIENT_WEIGHT_MAX).length;

export function EditWeightField({ id, describedBy }: EditWeightFieldProps) {
  const { register } = useFormContext<IngredientEditFormInput>();
  const {
    field: { ref, name, value, onChange, onBlur },
    fieldState,
  } = useController<IngredientEditFormInput, "weightValue">({
    name: "weightValue",
  });

  return (
    <div className={getFieldControlClassName(Boolean(fieldState.error))}>
      <input
        id={id}
        ref={ref}
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
          onChange(sanitizeIntegerInput(event.target.value, WEIGHT_MAX_LENGTH))
        }
        onBlur={onBlur}
        aria-invalid={fieldState.error ? true : undefined}
        aria-describedby={describedBy}
        className={`${FIELD_INPUT_CLASS_NAME} text-right`}
      />
      <select
        aria-label="무게 단위"
        {...register("weightUnit")}
        className="-mr-1 flex-none cursor-pointer border-0 bg-transparent py-1 pr-0 pl-1 text-[13px] font-medium text-app-ink/70 outline-none"
      >
        {EDIT_WEIGHT_UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {INGREDIENT_WEIGHT_UNIT_LABELS[unit]}
          </option>
        ))}
      </select>
    </div>
  );
}
