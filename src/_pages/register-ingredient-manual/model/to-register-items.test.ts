import { expect, it } from "vitest";

import { toRegisterIngredientItems } from "./to-register-items";

it("sends only the selected weight measurement", () => {
  expect(
    toRegisterIngredientItems([
      {
        name: "두부",
        storageType: "REFRIGERATED",
        quantity: null,
        weightValue: 400,
        weightUnit: "G",
        expirationDate: "2026-09-25",
      },
    ]),
  ).toEqual([
    {
      name: "두부",
      category: "OTHER",
      storageType: "REFRIGERATED",
      measureType: "WEIGHT",
      quantity: null,
      weightValue: 400,
      weightUnit: "G",
      expirationDate: "2026-09-25",
      registrationSource: "DIRECT",
    },
  ]);
});

it("sends only the selected count measurement", () => {
  const result = toRegisterIngredientItems([
    {
      name: "두부",
      storageType: "REFRIGERATED",
      quantity: 2,
      weightValue: null,
      weightUnit: "NONE",
      expirationDate: "2026-09-25",
    },
  ]);
  expect(result[0]).toMatchObject({
    measureType: "COUNT",
    quantity: 2,
    weightValue: null,
    weightUnit: "NONE",
  });
});
