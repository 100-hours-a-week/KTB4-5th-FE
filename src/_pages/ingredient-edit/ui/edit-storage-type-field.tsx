"use client";

import { useFormContext } from "react-hook-form";

import { INGREDIENT_STORAGE_TYPE_LABELS } from "@/entities/ingredient";

import type { IngredientEditFormInput } from "../model/ingredient-edit-form-schema";
import { FIELD_LABEL_CLASS_NAME } from "./field-styles";

const storageTypeOptions = Object.entries(INGREDIENT_STORAGE_TYPE_LABELS);

export function EditStorageTypeField() {
  const { register } = useFormContext<IngredientEditFormInput>();

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className={FIELD_LABEL_CLASS_NAME}>보관 방법</legend>
      <div className="flex gap-1.5">
        {storageTypeOptions.map(([storageType, label]) => (
          <label key={storageType} className="relative min-w-0 flex-1">
            <input
              type="radio"
              value={storageType}
              {...register("storageType")}
              className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
            />
            <span className="flex h-10 items-center justify-center rounded-[3px] border border-app-ink/25 bg-app-canvas/60 font-app-body text-[13px] font-medium text-app-ink/65 peer-checked:border-app-ink peer-checked:bg-app-ink peer-checked:font-bold peer-checked:text-app-canvas peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-app-primary">
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
