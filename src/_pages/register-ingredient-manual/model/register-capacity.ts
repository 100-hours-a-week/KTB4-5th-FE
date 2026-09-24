import type { IngredientListPage } from "@/entities/ingredient";
import { toStockKey } from "@/features/ingredient-form";
import {
  addDaysToIsoDate,
  getTodayInSeoul,
} from "@/features/select-expiration-date";

export type RegisterCapacity = {
  stockTypeCount: number;
  stockTypeLimit: number;
  existingStockKeys: string[];
};

export function getRegisterCapacity(
  page: IngredientListPage
): RegisterCapacity {
  const today = getTodayInSeoul();

  return {
    stockTypeCount: page.ingredientsNum,
    stockTypeLimit: page.refrigeratorCapacity,
    existingStockKeys: page.ingredients.map((ingredient) =>
      toStockKey(
        ingredient.name,
        ingredient.storageType,
        addDaysToIsoDate(today, ingredient.daysUntilExpiration)
      )
    ),
  };
}
