import type { IngredientStorageType } from "@/entities/ingredient";
import { INGREDIENT_REGISTER_BATCH_LIMIT } from "@/shared/config";

import { normalizeIngredientName } from "../lib/draft-input";
import type { RegisterCapacity } from "./register-capacity";
import { toStockKey } from "./stock-key";

/** 품목 종류 판정에 필요한 부분만 본다. 폼 입력값과 검증 결과값 모두 이 모양을 만족한다. */
export type DraftStockFields = {
  name: string;
  storageType: IngredientStorageType;
  expirationDate: string;
};

export type DraftSummary = {
  draftCount: number;
  batchLimit: number;
  /** 이번에 등록하는 품목 종류 수. 기존 품목에 합산되는 종류도 세고, 같은 품목으로 묶이는 초안은 한 종으로 센다. */
  registeredTypeCount: number;
  /** 기존 품목과 합산되지 않는, 실제로 새로 생기는 품목 종류 수. */
  newStockTypeCount: number;
  stockTypeCountAfter: number;
  stockTypeLimit: number;
  /** 0보다 크면 한도를 넘은 종 수이며 등록을 막는다. */
  overLimitCount: number;
  /** 기존 품목과 합산될 재료 이름. 등록 전 확인 모달에서 보여준다. */
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
  // 키를 아직 만들 수 없는 초안은 서로 같은 품목인지 알 수 없으므로 각각 신규로 센다.
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
