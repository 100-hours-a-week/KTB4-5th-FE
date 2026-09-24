import type { IngredientStorageType } from "./ingredient";

export function normalizeIngredientName(value: string) {
  return value.trim().replace(/ {2,}/g, " ");
}

export function toStockKey(
  name: string,
  storageType: IngredientStorageType,
  expirationDate: string,
) {
  return `${normalizeIngredientName(name)}|${storageType}|${expirationDate}`;
}
