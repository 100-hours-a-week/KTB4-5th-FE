import {
  getIngredientCapacity,
  type IngredientCapacity,
  type IngredientListPage,
  toStockKey,
} from "@/entities/ingredient";
import { addDaysToIsoDate } from "@/features/select-expiration-date";

export type RegisterCapacity = IngredientCapacity & {
  existingStockKeys: string[];
};

export function getRegisterCapacity(
  page: IngredientListPage,
): RegisterCapacity {
  return {
    ...getIngredientCapacity(page),
    existingStockKeys: page.ingredients.map((ingredient) =>
      toStockKey(
        ingredient.name,
        ingredient.storageType,
        addDaysToIsoDate(page.baseDate, ingredient.daysUntilExpiration),
      ),
    ),
  };
}
