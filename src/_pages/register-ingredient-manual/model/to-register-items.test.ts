import { describe, expect, it } from "vitest";

import type { ManualIngredientDraftValues } from "./manual-register-form-schema";
import { toRegisterIngredientItems } from "./to-register-items";

const countDraft: ManualIngredientDraftValues = {
  name: "달걀",
  storageType: "REFRIGERATED",
  quantity: 30,
  weightValue: null,
  weightUnit: "NONE",
  expirationDate: "2026-09-30",
};

const weightDraft: ManualIngredientDraftValues = {
  name: "두부",
  storageType: "REFRIGERATED",
  quantity: 1,
  weightValue: 300,
  weightUnit: "G",
  expirationDate: "2026-09-30",
};

describe("toRegisterIngredientItems", () => {
  it("sends a count item without weight fields", () => {
    expect(toRegisterIngredientItems([countDraft])).toEqual([
      {
        name: "달걀",
        category: "OTHER",
        storageType: "REFRIGERATED",
        measureType: "COUNT",
        quantity: 30,
        weightValue: null,
        weightUnit: "NONE",
        expirationDate: "2026-09-30",
        registrationSource: "DIRECT",
        imageUploadId: null,
      },
    ]);
  });

  it("sends a weight item without the quantity the form always carries", () => {
    const [item] = toRegisterIngredientItems([weightDraft]);

    expect(item.measureType).toBe("WEIGHT");
    expect(item.quantity).toBeNull();
    expect(item.weightValue).toBe(300);
    expect(item.weightUnit).toBe("G");
  });

  it("keeps the draft order of a batch", () => {
    expect(
      toRegisterIngredientItems([weightDraft, countDraft]).map(
        (item) => item.name,
      ),
    ).toEqual(["두부", "달걀"]);
  });
});
