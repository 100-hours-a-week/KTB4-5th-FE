import { requestJson } from "@/shared/api";

import type {
  IngredientCategory,
  IngredientMeasureType,
  IngredientStorageType,
  IngredientWeightUnit,
} from "../model/ingredient";

export const INGREDIENT_REGISTRATION_SOURCES = ["DIRECT", "RECEIPT"] as const;
export type IngredientRegistrationSource =
  (typeof INGREDIENT_REGISTRATION_SOURCES)[number];

/** 수량과 무게는 measureType에 맞는 한쪽만 값을 가진다. */
export type RegisterIngredientItem = {
  name: string;
  category: IngredientCategory;
  storageType: IngredientStorageType;
  measureType: IngredientMeasureType;
  quantity: number | null;
  weightValue: number | null;
  weightUnit: IngredientWeightUnit;
  expirationDate: string;
  registrationSource: IngredientRegistrationSource;
};

export type RegisterMergedItem = {
  ingredientId: number;
  name: string;
  storageType: IngredientStorageType;
  expirationDate: string;
  measureType: IngredientMeasureType;
  previousQuantity: number | null;
  addedQuantity: number | null;
  totalQuantity: number | null;
  previousWeightValue: string | null;
  addedWeightValue: string | null;
  totalWeightValue: string | null;
  weightUnit: IngredientWeightUnit;
};

export type RegisterBatchResult = {
  /** 새로 생긴 행 수. 이 수만큼만 냉장고 용량을 쓴다. */
  createdCount: number;
  mergedCount: number;
  ingredientsNum: number;
  refrigeratorCapacity: number;
  mergedItems: RegisterMergedItem[];
};

type RegisterIngredientsParams = {
  refrigeratorId: string;
  items: readonly RegisterIngredientItem[];
};

/**
 * 한 요청 전체가 하나의 트랜잭션이라 한 건이라도 검증에 걸리면 아무것도
 * 저장되지 않으며, 항목별 오류는 응답으로 내려오지 않는다. 이름·보관 방법·
 * 유통기한·측정 방식·단위가 모두 같은 기존 재고에는 새 행을 만들지 않고
 * 수량을 합산한다.
 */
export async function registerIngredients({
  refrigeratorId,
  items,
}: RegisterIngredientsParams): Promise<RegisterBatchResult> {
  const response = await requestJson<RegisterBatchResult>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/ingredients`,
    { method: "POST", json: { items } },
  );

  return response.data;
}
