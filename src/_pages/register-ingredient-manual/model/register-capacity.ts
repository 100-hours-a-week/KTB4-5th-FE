import { getMockIngredientList } from "@/entities/ingredient";
import { toStockKey } from "@/features/ingredient-form";
import {
  addDaysToIsoDate,
  getTodayInSeoul,
} from "@/features/select-expiration-date";
import { STOCK_TYPE_LIMIT } from "@/shared/config";

export type RegisterCapacity = {
  stockTypeCount: number;
  stockTypeLimit: number;
  /** 이미 등록된 품목의 `이름 + 보관 방법 + 유효기간` 키. 합산 대상 판정에 쓴다. */
  existingStockKeys: string[];
};

// TODO: API 연동 시 현재 등록 품목 종류 수와 품목 키 조회 결과로 교체한다.
export function getRegisterCapacity(): RegisterCapacity {
  const { ingredientsNum, ingredients } = getMockIngredientList({
    filter: null,
    sort: "EXPIRATION_ASC",
  });
  const today = getTodayInSeoul();

  return {
    stockTypeCount: ingredientsNum,
    stockTypeLimit: STOCK_TYPE_LIMIT,
    existingStockKeys: ingredients.map((ingredient) =>
      toStockKey(
        ingredient.name,
        ingredient.storageType,
        addDaysToIsoDate(today, ingredient.daysUntilExpiration),
      ),
    ),
  };
}
