import { expect, it } from "vitest";

import { toUpdateIngredientBody } from "./to-update-ingredient-body";

const initial = {
  name: "두부",
  measureType: "WEIGHT" as const,
  storageType: "REFRIGERATED" as const,
  quantity: "1",
  weightValue: "300",
  weightUnit: "G" as const,
  expirationDate: "2026-09-15",
};

it("sends only the final weight and keeps an unchanged past expiration date", () => {
  expect(
    toUpdateIngredientBody(initial, {
      ...initial,
      quantity: 1,
      weightValue: 250,
    }),
  ).toEqual({ weightValue: "250" });
});

it("sends the final count without a weight value", () => {
  const count = {
    ...initial,
    measureType: "COUNT" as const,
    quantity: "10",
    weightValue: "",
  };
  expect(
    toUpdateIngredientBody(count, {
      ...count,
      quantity: 7,
      weightValue: null,
      weightUnit: "NONE",
    }),
  ).toEqual({ quantity: 7 });
});
