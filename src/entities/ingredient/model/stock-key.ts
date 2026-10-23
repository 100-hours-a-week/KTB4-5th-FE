import type { IngredientStorageType, IngredientWeightUnit } from "./ingredient";

export function normalizeIngredientName(value: string) {
  return value.normalize("NFC").trim().replace(/ {2,}/g, " ");
}

export function toStockKey(
  name: string,
  storageType: IngredientStorageType,
  expirationDate: string,
  weightUnit: IngredientWeightUnit,
) {
  return `${normalizeIngredientName(name)}|${storageType}|${expirationDate}|${weightUnit}`;
}
