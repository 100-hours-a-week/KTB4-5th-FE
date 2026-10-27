import { expect, it } from "vitest";
import type { RecipeIngredient, RecipeDetail } from "@/entities/recommendation";
import {
  getRecipeConsumeRows,
  getRecipeIngredientState,
} from "./recipe-ingredients";

const today = "2026-09-10";
const ingredient: RecipeIngredient = {
  recipeIngredientId: "11",
  name: "두부",
  requiredAmount: 3,
  amountText: "3개",
  unit: "EA",
  stocks: [
    {
      ingredientId: "expired",
      expirationDate: "2026-09-09",
      ownedAmount: 10,
      unit: "EA",
    },
    {
      ingredientId: "today",
      expirationDate: today,
      ownedAmount: 1,
      unit: "EA",
    },
    {
      ingredientId: "later",
      expirationDate: "2026-09-15",
      ownedAmount: 1,
      unit: "EA",
    },
  ],
};
const recipe = (ingredients: RecipeIngredient[]): RecipeDetail => ({
  recipeId: "51",
  name: "두부김치",
  imageUrl: null,
  cookingTimeMinutes: null,
  baseServings: null,
  expiringIngredientCount: 1,
  ingredients,
  steps: [],
});
it("excludes expired stocks, includes today, and caps insufficient deductions", () => {
  expect(getRecipeIngredientState(ingredient, today)).toEqual({
    kind: "short",
    ingredientId: "today",
    shortage: "1개",
  });
  expect(getRecipeConsumeRows(recipe([ingredient]), today)).toEqual([
    {
      recipeIngredientId: "11",
      name: "두부",
      amountText: "3개",
      before: 2,
      after: 0,
      unitLabel: "개",
      partial: true,
    },
  ]);
});
it("skips missing, unquantifiable, and mixed-unit deductions", () => {
  const missing = { ...ingredient, stocks: [] };
  expect(getRecipeIngredientState(missing, today)).toEqual({ kind: "missing" });
  expect(
    getRecipeConsumeRows(
      recipe([
        missing,
        { ...ingredient, requiredAmount: null },
        { ...ingredient, stocks: [{ ...ingredient.stocks[1], unit: "G" }] },
      ]),
      today,
    ),
  ).toEqual([]);
});
