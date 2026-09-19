import type { Ingredient } from "../model/ingredient";
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

export function formatIngredientAmount(ingredient: Ingredient): string {
  const parts = [
    INGREDIENT_STORAGE_TYPE_LABELS[ingredient.storageType],
    `${ingredient.quantity}${INGREDIENT_QUANTITY_UNIT}`,
  ];

  if (ingredient.weightValue !== null && ingredient.weightUnit !== "NONE") {
    parts.push(
      `${ingredient.weightValue}${INGREDIENT_WEIGHT_UNIT_LABELS[ingredient.weightUnit]}`,
    );
  }

  return parts.join(" · ");
}
