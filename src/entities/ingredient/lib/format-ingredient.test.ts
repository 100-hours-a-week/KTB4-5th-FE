import { expect, it } from "vitest";

import type { Ingredient } from "../model/ingredient";
import { formatIngredientAmount } from "./format-ingredient";

const ingredient: Ingredient = {
  ingredientId: "1",
  name: "두부",
  category: "TOFU_BEAN",
  measureType: "WEIGHT",
  quantity: 2,
  weightValue: 400,
  weightUnit: "G",
  storageType: "REFRIGERATED",
  status: "NORMAL",
  daysUntilExpiration: 10,
};

it("shows entered count and integer weight", () => {
  expect(formatIngredientAmount(ingredient)).toBe("냉장 · 2개 · 400g");
});

it("does not render a fake count for rows with null quantity", () => {
  expect(formatIngredientAmount({ ...ingredient, quantity: null })).toBe(
    "냉장 · 400g",
  );
});
