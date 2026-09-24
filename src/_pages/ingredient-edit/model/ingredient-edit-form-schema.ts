import { z } from "zod";

import {
  INGREDIENT_MEASURE_TYPES,
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

const baseSchema = z.object({
  name: ingredientNameSchema,
  measureType: z.enum(INGREDIENT_MEASURE_TYPES),
  storageType: z.enum(INGREDIENT_STORAGE_TYPES),
  quantity: ingredientQuantitySchema,
  weightValue: ingredientWeightValueSchema,
  weightUnit: z.enum(EDIT_WEIGHT_UNITS),
  expirationDate: z.string(),
});

export function createIngredientEditFormSchema(initialExpirationDate: string) {
  return (
    baseSchema
      .superRefine((values, ctx) => {
        if (values.expirationDate !== initialExpirationDate) {
          const date = ingredientExpirationDateSchema.safeParse(
            values.expirationDate,
          );
          if (!date.success) {
            ctx.addIssue({
              code: "custom",
              path: ["expirationDate"],
              message:
                date.error.issues[0]?.message ?? "유통기한을 확인해주세요",
            });
          }
        }
        if (values.measureType === "WEIGHT" && values.weightValue === null) {
          ctx.addIssue({
            code: "custom",
            path: ["weightValue"],
            message: "무게 또는 부피 값을 입력해주세요",
          });
        }
      })
      .transform((values) => ({
        ...values,
        weightUnit:
          values.measureType === "COUNT"
            ? ("NONE" as const)
            : (values.weightUnit as IngredientWeightUnit),
      }))
  );
}

export const ingredientEditFormSchema = createIngredientEditFormSchema("");

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
    current.expirationDate !== initial.expirationDate
  ) {
    return true;
  }

  if (initial.measureType === "COUNT") {
    return current.quantity !== initial.quantity;
  }

  return (
    current.weightValue !== initial.weightValue ||
    current.weightUnit !== initial.weightUnit
  );
}
