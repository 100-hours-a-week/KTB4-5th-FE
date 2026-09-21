import { getMockIngredientList, type Ingredient } from "@/entities/ingredient";
import {
  addDaysToIsoDate,
  getTodayInSeoul,
} from "@/features/select-expiration-date";

// TODO: API 연동 시 `entities/ingredient/api`의 상세 조회 함수와 DTO mapper로 교체한다.
export type MockIngredientDetail = Ingredient & {
  expirationDate: string;
  createdDate: string;
};

const MOCK_CREATED_DATE = "2026-09-15";

const fallbackIngredientDetail: MockIngredientDetail = {
  ingredientId: "",
  name: "대파",
  category: "VEGETABLE",
  measureType: "COUNT",
  quantity: 3,
  weightValue: null,
  weightUnit: "NONE",
  storageType: "REFRIGERATED",
  status: "NORMAL",
  daysUntilExpiration: 9,
  expirationDate: addDaysToIsoDate(getTodayInSeoul(), 9),
  createdDate: "2026-09-12",
};

export function getMockIngredientDetail(
  ingredientId: string,
): MockIngredientDetail {
  const { ingredients } = getMockIngredientList({
    filter: null,
    sort: "EXPIRATION_ASC",
  });
  const ingredient = ingredients.find(
    (item) => item.ingredientId === ingredientId,
  );

  if (!ingredient) {
    return { ...fallbackIngredientDetail, ingredientId };
  }

  return {
    ...ingredient,
    expirationDate: addDaysToIsoDate(
      getTodayInSeoul(),
      ingredient.daysUntilExpiration,
    ),
    createdDate: MOCK_CREATED_DATE,
  };
}
