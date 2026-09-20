import { getMockIngredientList, type Ingredient } from "@/entities/ingredient";

export const HOME_ATTENTION_LIMIT = 3;

export type HomeSummary = {
  attentionItems: Ingredient[];
  stockTypeCount: number;
};

// TODO: API 연동 시 재고 목록 조회 결과로 교체한다.
export function getHomeSummary(): HomeSummary {
  const list = getMockIngredientList({
    filter: null,
    sort: "EXPIRATION_ASC",
  });

  return {
    attentionItems: list.ingredients
      .filter((ingredient) => ingredient.status !== "NORMAL")
      .slice(0, HOME_ATTENTION_LIMIT),
    stockTypeCount: list.ingredientsNum,
  };
}
