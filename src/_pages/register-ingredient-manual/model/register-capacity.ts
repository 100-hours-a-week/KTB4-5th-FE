import {
  getIngredientCapacity,
  type IngredientCapacity,
  type IngredientListPage,
  toStockKey,
} from "@/entities/ingredient";
import {
  addDaysToIsoDate,
  getTodayInSeoul,
} from "@/features/select-expiration-date";

export type RegisterCapacity = IngredientCapacity & {
  existingStockKeys: string[];
};

export function getRegisterCapacity(
  page: IngredientListPage,
): RegisterCapacity {
  const today = getTodayInSeoul();

  return {
    ...getIngredientCapacity(page),
    existingStockKeys: page.ingredients.map((ingredient) =>
      toStockKey(
        ingredient.name,
        ingredient.storageType,
        addDaysToIsoDate(today, ingredient.daysUntilExpiration),
      ),
    ),
  };
}
