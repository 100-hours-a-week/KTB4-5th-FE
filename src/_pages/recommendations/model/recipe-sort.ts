import type { RecommendedRecipe } from "@/entities/recommendation";

export const RECIPE_SORTS = ["EXPIRING", "OWNED", "SHORTAGE"] as const;
export type RecipeSort = (typeof RECIPE_SORTS)[number];

export const RECIPE_SORT_LABELS: Record<RecipeSort, string> = {
  EXPIRING: "임박 많은 순",
  OWNED: "보유 많은 순",
  SHORTAGE: "부족 적은 순",
};

const shortage = (recipe: RecommendedRecipe) =>
  recipe.ingredientCounts.total - recipe.ingredientCounts.owned;

const compare: Record<
  RecipeSort,
  (a: RecommendedRecipe, b: RecommendedRecipe) => number
> = {
  EXPIRING: (a, b) => b.ingredientCounts.expiring - a.ingredientCounts.expiring,
  OWNED: (a, b) => b.ingredientCounts.owned - a.ingredientCounts.owned,
  SHORTAGE: (a, b) => shortage(a) - shortage(b),
};

export function sortRecipes(recipes: RecommendedRecipe[], sort: RecipeSort) {
  return [...recipes].sort(compare[sort]);
}
