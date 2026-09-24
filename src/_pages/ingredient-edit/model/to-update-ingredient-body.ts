import type { UpdateIngredientBody } from "@/entities/ingredient";

import type {
  IngredientEditFormInput,
  IngredientEditFormValues,
} from "./ingredient-edit-form-schema";

export function toUpdateIngredientBody(
  initial: IngredientEditFormInput,
  values: IngredientEditFormValues,
): UpdateIngredientBody {
  const body: UpdateIngredientBody = {};

  if (values.name !== initial.name.trim()) body.name = values.name;
  if (values.storageType !== initial.storageType)
    body.storageType = values.storageType;
  if (values.expirationDate !== initial.expirationDate)
    body.expirationDate = values.expirationDate;

  if (values.measureType === "COUNT") {
    if (values.quantity !== Number(initial.quantity))
      body.quantity = values.quantity;
  } else {
    if (values.weightValue !== Number(initial.weightValue)) {
      body.weightValue = String(values.weightValue);
    }
    if (values.weightUnit !== initial.weightUnit)
      body.weightUnit = values.weightUnit;
  }

  return body;
}
