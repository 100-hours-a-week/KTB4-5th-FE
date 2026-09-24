import type { IngredientDetailView } from "@/entities/ingredient";

import type { IngredientEditFormInput } from "./ingredient-edit-form-schema";

export type IngredientEditTarget = {
  ingredientId: string;
  etag: string | null;
  createdDate: string;
  initialValues: IngredientEditFormInput;
};

export function toIngredientEditTarget({
  ingredient: detail,
  etag,
}: IngredientDetailView): IngredientEditTarget {
  return {
    ingredientId: detail.ingredientId,
    etag,
    createdDate: detail.createdDate,
    initialValues: {
      name: detail.name,
      measureType: detail.measureType,
      storageType: detail.storageType,
      quantity: String(detail.quantity ?? 1),
      weightValue:
        detail.weightValue === null ? "" : String(detail.weightValue),
      weightUnit: detail.weightUnit === "ML" ? "ML" : "G",
      expirationDate: detail.expirationDate,
    },
  };
}
