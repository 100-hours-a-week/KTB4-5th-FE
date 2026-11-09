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
      usedAmount: null,
      allocationStatus: "UNRESOLVED",
      unit: "EA",
    },
    {
      ingredientId: "today",
      expirationDate: today,
      ownedAmount: 1,
      usedAmount: null,
      allocationStatus: "UNRESOLVED",
      unit: "EA",
    },
    {
      ingredientId: "later",
      expirationDate: "2026-09-15",
      ownedAmount: 1,
      usedAmount: null,
      allocationStatus: "UNRESOLVED",
      unit: "EA",
    },
  ],
};
const recipe = (ingredients: RecipeIngredient[]): RecipeDetail => ({
  recipeId: "51",
  name: "두부김치",
  imageUrl: null,
  cookingTimeMinutes: null,
  targetServings: null,
  expiringIngredientCount: 1,
  ingredients,
  steps: [],
});
it("shows ownership without calculating shortages, excluding expired stocks and including today", () => {
  expect(getRecipeIngredientState(ingredient, today)).toEqual({
    kind: "owned",
    ingredientId: "today",
    daysUntilExpiration: 0,
  });
  expect(
    getRecipeIngredientState({ ...ingredient, stocks: [] }, today),
  ).toEqual({ kind: "missing" });
});
it("previews only server-calculated deductions and merges shared stock allocations", () => {
  const calculated: RecipeIngredient = {
    ...ingredient,
    stocks: [
      {
        ...ingredient.stocks[1],
        ownedAmount: 5,
        usedAmount: 1,
        allocationStatus: "CALCULATED",
      },
      ingredient.stocks[2],
    ],
  };
  const second = {
    ...calculated,
    recipeIngredientId: "12",
    stocks: [{ ...calculated.stocks[0], usedAmount: 2 }],
  };
  expect(getRecipeConsumeRows(recipe([calculated, second]))).toEqual([
    {
      ingredientId: "today",
      name: "두부",
      amountText: "3개",
      before: 5,
      after: 2,
      unitLabel: "개",
    },
  ]);
});
it("does not invent deductions for unresolved, empty or zero allocations", () => {
  expect(
    getRecipeConsumeRows(
      recipe([
        ingredient,
        { ...ingredient, stocks: [] },
        {
          ...ingredient,
          stocks: [
            {
              ...ingredient.stocks[1],
              usedAmount: 0,
              allocationStatus: "CALCULATED",
            },
          ],
        },
      ]),
    ),
  ).toEqual([]);
});
