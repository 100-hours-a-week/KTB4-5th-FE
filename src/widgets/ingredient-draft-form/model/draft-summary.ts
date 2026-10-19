import {
  type IngredientStorageType,
  normalizeIngredientName,
  toStockKey,
} from "@/entities/ingredient";
import { INGREDIENT_REGISTER_BATCH_LIMIT } from "@/shared/config";

import type { RegisterCapacity } from "./register-capacity";

export type DraftStockFields = {
  name: string;
  storageType: IngredientStorageType;
  expirationDate: string;
};

export type DraftSummary = {
  draftCount: number;
  batchLimit: number;
  registeredTypeCount: number;
  newStockTypeCount: number;
  stockTypeCountAfter: number;
  stockTypeLimit: number;
  overLimitCount: number;
  mergingNames: string[];
  isBatchLimitReached: boolean;
};

function getDraftStockKey(draft: DraftStockFields) {
  const name = normalizeIngredientName(draft.name);

  if (name === "" || draft.expirationDate === "") {
    return null;
  }

  return toStockKey(name, draft.storageType, draft.expirationDate);
}

export function summarizeDrafts(
  drafts: readonly DraftStockFields[],
  capacity: RegisterCapacity,
): DraftSummary {
  const existingStockKeys = new Set(capacity.existingStockKeys);
  const newStockKeys = new Set<string>();
  const mergedStockKeys = new Set<string>();
  const mergingNames: string[] = [];
  let incompleteDraftCount = 0;

  for (const draft of drafts) {
    const stockKey = getDraftStockKey(draft);

    if (stockKey === null) {
      incompleteDraftCount += 1;
      continue;
    }

    if (existingStockKeys.has(stockKey)) {
      mergingNames.push(normalizeIngredientName(draft.name));
      mergedStockKeys.add(stockKey);
      continue;
    }

    newStockKeys.add(stockKey);
  }

  const newStockTypeCount = newStockKeys.size + incompleteDraftCount;
  const stockTypeCountAfter = capacity.stockTypeCount + newStockTypeCount;

  return {
    draftCount: drafts.length,
    batchLimit: INGREDIENT_REGISTER_BATCH_LIMIT,
    registeredTypeCount: newStockTypeCount + mergedStockKeys.size,
    newStockTypeCount,
    stockTypeCountAfter,
    stockTypeLimit: capacity.stockTypeLimit,
    overLimitCount: Math.max(stockTypeCountAfter - capacity.stockTypeLimit, 0),
    mergingNames,
    isBatchLimitReached: drafts.length >= INGREDIENT_REGISTER_BATCH_LIMIT,
  };
}
