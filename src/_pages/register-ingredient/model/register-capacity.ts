import { getMockIngredientList } from "@/entities/ingredient";
import { STOCK_TYPE_LIMIT } from "@/shared/config";

export type RegisterCapacity = {
  stockTypeCount: number;
  stockTypeLimit: number;
  remainingSlots: number;
  isLimitReached: boolean;
};

// TODO: API 연동 시 현재 등록 품목 종류 수 조회 결과로 교체한다.
export function getRegisterCapacity(): RegisterCapacity {
  const { ingredientsNum } = getMockIngredientList({
    filter: null,
    sort: "EXPIRATION_ASC",
  });
  const remainingSlots = Math.max(STOCK_TYPE_LIMIT - ingredientsNum, 0);

  return {
    stockTypeCount: ingredientsNum,
    stockTypeLimit: STOCK_TYPE_LIMIT,
    remainingSlots,
    isLimitReached: remainingSlots === 0,
  };
}
