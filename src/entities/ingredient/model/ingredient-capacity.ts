export type IngredientCapacity = {
  stockTypeCount: number;
  stockTypeLimit: number;
  remainingSlots: number;
  isLimitReached: boolean;
};

type IngredientCapacitySource = {
  ingredientsNum: number;
  refrigeratorCapacity: number;
};

export function getIngredientCapacity({
  ingredientsNum,
  refrigeratorCapacity,
}: IngredientCapacitySource): IngredientCapacity {
  const remainingSlots = Math.max(refrigeratorCapacity - ingredientsNum, 0);

  return {
    stockTypeCount: ingredientsNum,
    stockTypeLimit: refrigeratorCapacity,
    remainingSlots,
    isLimitReached: remainingSlots === 0,
  };
}
