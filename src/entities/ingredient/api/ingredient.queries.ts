// 재고는 냉장고마다 다른 데이터이므로 모든 키에 refrigeratorId를 포함한다.
export const ingredientQueries = {
  all: (refrigeratorId: string) =>
    ["refrigerators", refrigeratorId, "ingredients"] as const,
};
