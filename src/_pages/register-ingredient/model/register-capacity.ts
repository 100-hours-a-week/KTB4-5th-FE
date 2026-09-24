import type { IngredientListPage } from "@/entities/ingredient";

export type RegisterCapacity = {
  stockTypeCount: number;
  stockTypeLimit: number;
  remainingSlots: number;
  isLimitReached: boolean;
};

export function getRegisterCapacity(page: IngredientListPage): RegisterCapacity {
  const remainingSlots = Math.max(
    page.refrigeratorCapacity - page.ingredientsNum,
    0,
  );

  return {
    stockTypeCount: page.ingredientsNum,
    stockTypeLimit: page.refrigeratorCapacity,
    remainingSlots,
    isLimitReached: remainingSlots === 0,
  };
}
