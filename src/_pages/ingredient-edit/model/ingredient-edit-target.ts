import type { Ingredient, IngredientDetail } from "@/entities/ingredient";
import { toStockKey } from "@/features/ingredient-form";
import {
  addDaysToIsoDate,
  getTodayInSeoul,
} from "@/features/select-expiration-date";

import type { IngredientEditFormInput } from "./ingredient-edit-form-schema";

export type MergeTarget = {
  ingredientId: string;
  name: string;
};

export type IngredientEditTarget = {
  ingredientId: string;
  createdDate: string;
  initialValues: IngredientEditFormInput;
  mergeCandidates: Record<string, MergeTarget>;
};

export function toIngredientEditTarget(
  detail: IngredientDetail,
  listedIngredients: readonly Ingredient[],
): IngredientEditTarget {
  const today = getTodayInSeoul();
  const mergeCandidates: Record<string, MergeTarget> = {};

  for (const ingredient of listedIngredients) {
    if (
      ingredient.ingredientId === detail.ingredientId ||
      ingredient.measureType !== detail.measureType
    ) {
      continue;
    }

    const stockKey = toStockKey(
      ingredient.name,
      ingredient.storageType,
      addDaysToIsoDate(today, ingredient.daysUntilExpiration),
    );

    mergeCandidates[stockKey] = {
      ingredientId: ingredient.ingredientId,
      name: ingredient.name,
    };
  }

  return {
    ingredientId: detail.ingredientId,
    createdDate: detail.createdDate,
    initialValues: {
      name: detail.name,
      measureType: detail.measureType,
      storageType: detail.storageType,
      quantity: String(detail.quantity ?? 1),
      weightValue:
        detail.weightValue === null ? "" : String(detail.weightValue),
      weightUnit: detail.weightUnit === "ML" ? "ML" : "G",
      expirationDate:
        detail.daysUntilExpiration < 0 ? "" : detail.expirationDate,
    },
    mergeCandidates,
  };
}
