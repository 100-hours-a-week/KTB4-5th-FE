import {
  getIngredientCapacity,
  type IngredientCapacity,
  type IngredientListPage,
  toStockKey,
} from "@/entities/ingredient";
import { addDaysToIsoDate } from "@/features/select-expiration-date";

export type RegisterCapacity = IngredientCapacity & {
  existingStockKeys: string[];
  isEstimate: boolean;
};

export function getRegisterCapacity(
  page: IngredientListPage,
): RegisterCapacity {
  return {
    ...getIngredientCapacity(page),
    // 목록에는 소유자가 없어 전체를 받아도 기존 재고와의 합산 여부를 확정할 수 없다.
    isEstimate: page.nextCursor !== null || page.ingredientsNum > 0,
    existingStockKeys: page.ingredients.map((ingredient) =>
      toStockKey(
        ingredient.name,
        ingredient.storageType,
        addDaysToIsoDate(page.baseDate, ingredient.daysUntilExpiration),
        ingredient.weightUnit,
      ),
    ),
  };
}
