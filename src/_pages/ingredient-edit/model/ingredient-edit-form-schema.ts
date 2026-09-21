import { z } from "zod";

import {
  INGREDIENT_STORAGE_TYPES,
  type IngredientWeightUnit,
} from "@/entities/ingredient";
import {
  ingredientNameSchema,
  ingredientQuantitySchema,
  ingredientWeightValueSchema,
  normalizeIngredientName,
} from "@/features/ingredient-form";
import { ingredientExpirationDateSchema } from "@/features/select-expiration-date";

export const EDIT_WEIGHT_UNITS = ["G", "ML"] as const;

export const ingredientEditFormSchema = z
  .object({
    name: ingredientNameSchema,
    storageType: z.enum(INGREDIENT_STORAGE_TYPES),
    quantity: ingredientQuantitySchema,
    weightValue: ingredientWeightValueSchema,
    weightUnit: z.enum(EDIT_WEIGHT_UNITS),
    expirationDate: ingredientExpirationDateSchema,
  })
  // 무게를 비워 두면 단위도 고르지 않은 것이므로 NONE으로 보낸다.
  .transform((values) => ({
    ...values,
    weightUnit:
      values.weightValue === null
        ? ("NONE" as const)
        : (values.weightUnit as IngredientWeightUnit),
  }));

export type IngredientEditFormInput = z.input<typeof ingredientEditFormSchema>;
export type IngredientEditFormValues = z.output<
  typeof ingredientEditFormSchema
>;

/**
 * 저장 버튼은 값이 실제로 달라졌을 때만 열린다. 처음 값과 한 칸씩 비교하며,
 * 이름은 저장 형태(앞뒤 공백 제거)로 맞춰 본다.
 */
export function hasEditChanges(
  initial: IngredientEditFormInput,
  current: IngredientEditFormInput,
) {
  if (
    normalizeIngredientName(current.name) !==
    normalizeIngredientName(initial.name)
  ) {
    return true;
  }

  if (
    current.storageType !== initial.storageType ||
    current.quantity !== initial.quantity ||
    current.expirationDate !== initial.expirationDate ||
    current.weightValue !== initial.weightValue
  ) {
    return true;
  }

  // 무게를 비운 상태에서는 단위를 바꿔도 저장값(NONE)이 그대로다.
  return (
    current.weightValue !== "" && current.weightUnit !== initial.weightUnit
  );
}
