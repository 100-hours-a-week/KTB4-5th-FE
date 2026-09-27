"use client";

import type { Ref } from "react";

import { TEXT_FIELD_MAX_LENGTH } from "@/shared/config";

import { sanitizeIngredientNameInput } from "../lib/ingredient-name";

interface IngredientNameInputProps {
  id: string;
  name: string;
  value: string;
  describedBy: string;
  invalid: boolean;
  inputRef: Ref<HTMLInputElement>;
  onValueChange: (value: string) => void;
  onBlur: () => void;
}

const CONTROL_BASE_CLASS_NAME =
  "flex h-10 w-full items-center gap-1.5 border-b-[1.5px] bg-transparent px-0.5 text-left";

const INPUT_CLASS_NAME =
  "min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 font-app-mono text-[16px] font-bold leading-none text-app-ink outline-none placeholder:font-normal placeholder:text-app-ink/30";

function getControlClassName(invalid: boolean) {
  return `${CONTROL_BASE_CLASS_NAME} ${
    invalid
      ? "border-app-primary"
      : "border-app-ink/25 focus-within:border-app-ink"
  }`;
}

export function IngredientNameInput({
  id,
  name,
  value,
  describedBy,
  invalid,
  inputRef,
  onValueChange,
  onBlur,
}: IngredientNameInputProps) {
  return (
    <div className={getControlClassName(invalid)}>
      <input
        id={id}
        ref={inputRef}
        name={name}
        type="text"
        autoComplete="off"
        // 한글 IME 조합 중에도 특수문자·이모지가 확정되지 않도록 입력마다 걸러낸다.
        inputMode="text"
        maxLength={TEXT_FIELD_MAX_LENGTH * 2}
        placeholder="예) 두부"
        value={value}
        onChange={(event) =>
          onValueChange(sanitizeIngredientNameInput(event.target.value))
        }
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={INPUT_CLASS_NAME}
      />
    </div>
  );
}
