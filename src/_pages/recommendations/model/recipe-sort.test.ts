import { expect, it } from "vitest";
import type { RecommendedRecipe } from "@/entities/recommendation";
import { sortRecipes } from "./recipe-sort";
it("places unknown shortage counts after known counts without changing the source list", () => {
  const recipe = (
    id: string,
    total: number | null,
    owned: number | null,
  ): RecommendedRecipe => ({
    recipeId: id,
    name: id,
    imageUrl: null,
    cookingTimeMinutes: null,
    ingredientCounts: { total, owned, expiring: null },
  });
  const recipes = [
    recipe("unknown", null, null),
    recipe("short", 3, 1),
    recipe("owned", 3, 3),
  ];
  expect(
    sortRecipes(recipes, "SHORTAGE").map(({ recipeId }) => recipeId),
  ).toEqual(["owned", "short", "unknown"]);
  expect(recipes[0].recipeId).toBe("unknown");
});
