"use client";

import { useController } from "react-hook-form";

import { TEXT_FIELD_MAX_LENGTH } from "@/shared/config";

import { sanitizeIngredientNameInput } from "../lib/edit-input";
import type { IngredientEditFormInput } from "../model/ingredient-edit-form-schema";
import {
  FIELD_INPUT_CLASS_NAME,
  getFieldControlClassName,
} from "./field-styles";

type EditNameFieldProps = {
  id: string;
  describedBy: string;
};

export function EditNameField({ id, describedBy }: EditNameFieldProps) {
  const {
    field: { ref, name, value, onChange, onBlur },
    fieldState,
  } = useController<IngredientEditFormInput, "name">({ name: "name" });

  return (
    <div className={getFieldControlClassName(Boolean(fieldState.error))}>
      <input
        id={id}
        ref={ref}
        name={name}
        type="text"
        autoComplete="off"
        // 한글 IME 조합 중에도 특수문자·이모지가 확정되지 않도록 입력마다 걸러낸다.
        inputMode="text"
        maxLength={TEXT_FIELD_MAX_LENGTH * 2}
        placeholder="예) 두부"
        value={value}
        onChange={(event) =>
          onChange(sanitizeIngredientNameInput(event.target.value))
        }
        onBlur={onBlur}
        aria-invalid={fieldState.error ? true : undefined}
        aria-describedby={describedBy}
        className={FIELD_INPUT_CLASS_NAME}
      />
    </div>
  );
}
