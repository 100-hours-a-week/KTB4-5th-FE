"use client";

import type { Ref } from "react";

import {
  INGREDIENT_STORAGE_TYPE_LABELS,
  INGREDIENT_STORAGE_TYPES,
  type IngredientStorageType,
} from "@/entities/ingredient";

interface IngredientStorageTypeFieldProps {
  name: string;
  value: IngredientStorageType;
  inputRef: Ref<HTMLInputElement>;
  onValueChange: (value: IngredientStorageType) => void;
  onBlur: () => void;
  describedBy?: string;
}

const FIELD_LABEL_CLASS_NAME =
  "mb-0.5 block font-app-body text-xs font-bold leading-tight text-app-ink/50";

export function IngredientStorageTypeField({
  name,
  value,
  inputRef,
  onValueChange,
  onBlur,
  describedBy,
}: IngredientStorageTypeFieldProps) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className={FIELD_LABEL_CLASS_NAME}>보관 방법</legend>
      <div className="flex gap-1.5">
        {INGREDIENT_STORAGE_TYPES.map((storageType, index) => (
          <label key={storageType} className="relative min-w-0 flex-1">
            <input
              ref={index === 0 ? inputRef : undefined}
              type="radio"
              name={name}
              value={storageType}
              checked={value === storageType}
              aria-describedby={describedBy}
              onChange={() => onValueChange(storageType)}
              onBlur={onBlur}
              className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
            />
            <span className="flex h-10 items-center justify-center rounded-[3px] border border-app-ink/25 bg-app-canvas/60 font-app-body text-[13px] font-medium text-app-ink/65 peer-checked:border-app-ink peer-checked:bg-app-ink peer-checked:font-bold peer-checked:text-app-canvas peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-app-primary">
              {INGREDIENT_STORAGE_TYPE_LABELS[storageType]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
