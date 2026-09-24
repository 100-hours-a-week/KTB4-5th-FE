import type { Ingredient, IngredientWeightUnit } from "../model/ingredient";
import {
  INGREDIENT_QUANTITY_UNIT,
  INGREDIENT_STORAGE_TYPE_LABELS,
  INGREDIENT_WEIGHT_UNIT_LABELS,
} from "./ingredient-labels";

export function formatDaysUntilExpiration(daysUntilExpiration: number): string {
  if (daysUntilExpiration < 0) {
    return `${Math.abs(daysUntilExpiration)}일 지남`;
  }

  if (daysUntilExpiration === 0) {
    return "오늘까지";
  }

  return `D-${daysUntilExpiration}`;
}

export function formatIngredientQuantity(quantity: number): string {
  return `${quantity}${INGREDIENT_QUANTITY_UNIT}`;
}

export function formatIngredientWeight(
  weightValue: number | null,
  weightUnit: IngredientWeightUnit,
): string | null {
  if (weightValue === null || weightUnit === "NONE") {
    return null;
  }

  return `${weightValue}${INGREDIENT_WEIGHT_UNIT_LABELS[weightUnit]}`;
}

export function formatIngredientAmount(ingredient: Ingredient): string {
  const parts = [
    INGREDIENT_STORAGE_TYPE_LABELS[ingredient.storageType],
  ];
  if (ingredient.quantity !== null) {
    parts.push(formatIngredientQuantity(ingredient.quantity));
  }
  const weight = formatIngredientWeight(
    ingredient.weightValue,
    ingredient.weightUnit,
  );

  if (weight !== null) {
    parts.push(weight);
  }

  return parts.join(" · ");
}
