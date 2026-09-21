import type { IngredientStorageType } from "@/entities/ingredient";

import { normalizeIngredientName } from "../lib/edit-input";

/**
 * 품목 종류 판정 키:
 * `이름 + 보관 방법 + 유효기간`이 모두 같으면 같은 품목으로 보고 수량을 합산한다.
 */
export function toStockKey(
  name: string,
  storageType: IngredientStorageType,
  expirationDate: string,
) {
  return `${normalizeIngredientName(name)}|${storageType}|${expirationDate}`;
}
