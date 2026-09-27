import type { Ingredient, IngredientListPage } from "@/entities/ingredient";

export const HOME_ATTENTION_LIMIT = 3;

export type HomeSummary = {
  attentionItems: Ingredient[];
  stockTypeCount: number;
  stockTypeLimit: number;
};

export function toHomeSummary(page: IngredientListPage): HomeSummary {
  return {
    attentionItems: page.ingredients
      .filter((ingredient) => ingredient.status !== "NORMAL")
      .slice(0, HOME_ATTENTION_LIMIT),
    stockTypeCount: page.ingredientsNum,
    stockTypeLimit: page.refrigeratorCapacity,
  };
}
