import type { Ingredient } from "@/entities/ingredient";

// TODO: API 연동 시 `entities/ingredient/api`의 상세 조회 함수와 DTO mapper로 교체한다.
export type MockIngredientDetail = Ingredient & {
  expirationDate: string;
  createdDate: string;
};

const mockIngredientDetails: MockIngredientDetail[] = [
  {
    ingredientId: "1",
    name: "두유",
    category: "TOFU_BEAN",
    measureType: "COUNT",
    quantity: 2,
    weightValue: null,
    weightUnit: "NONE",
    storageType: "REFRIGERATED",
    status: "EXPIRED",
    daysUntilExpiration: -6,
    expirationDate: "2026-09-19",
    createdDate: "2026-09-15",
  },
  {
    ingredientId: "2",
    name: "애호박",
    category: "VEGETABLE",
    measureType: "COUNT",
    quantity: 1,
    weightValue: null,
    weightUnit: "NONE",
    storageType: "REFRIGERATED",
    status: "EXPIRED",
    daysUntilExpiration: -3,
    expirationDate: "2026-09-19",
    createdDate: "2026-09-15",
  },
  {
    ingredientId: "3",
    name: "달걀",
    category: "OTHER",
    measureType: "COUNT",
    quantity: 10,
    weightValue: null,
    weightUnit: "NONE",
    storageType: "REFRIGERATED",
    status: "EXPIRED",
    daysUntilExpiration: -2,
    expirationDate: "2026-09-19",
    createdDate: "2026-09-15",
  },
  {
    ingredientId: "4",
    name: "두부",
    category: "TOFU_BEAN",
    measureType: "WEIGHT",
    quantity: 2,
    weightValue: 300,
    weightUnit: "G",
    storageType: "REFRIGERATED",
    status: "EXPIRING_SOON",
    daysUntilExpiration: 0,
    expirationDate: "2026-09-19",
    createdDate: "2026-09-15",
  },
  {
    ingredientId: "5",
    name: "우유",
    category: "DAIRY",
    measureType: "WEIGHT",
    quantity: 1,
    weightValue: 900,
    weightUnit: "ML",
    storageType: "REFRIGERATED",
    status: "EXPIRING_SOON",
    daysUntilExpiration: 1,
    expirationDate: "2026-09-19",
    createdDate: "2026-09-15",
  },
  {
    ingredientId: "6",
    name: "닭가슴살",
    category: "MEAT",
    measureType: "WEIGHT",
    quantity: 4,
    weightValue: 400,
    weightUnit: "G",
    storageType: "FROZEN",
    status: "NORMAL",
    daysUntilExpiration: 12,
    expirationDate: "2026-09-19",
    createdDate: "2026-09-15",
  },
  {
    ingredientId: "7",
    name: "만두",
    category: "PROCESSED_FOOD",
    measureType: "COUNT",
    quantity: 1,
    weightValue: null,
    weightUnit: "NONE",
    storageType: "FROZEN",
    status: "NORMAL",
    daysUntilExpiration: 40,
    expirationDate: "2026-09-19",
    createdDate: "2026-09-15",
  },
  {
    ingredientId: "8",
    name: "간장",
    category: "SEASONING",
    measureType: "WEIGHT",
    quantity: 1,
    weightValue: 500,
    weightUnit: "ML",
    storageType: "REFRIGERATED",
    status: "NORMAL",
    daysUntilExpiration: 120,
    expirationDate: "2026-09-19",
    createdDate: "2026-09-15",
  },
];

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
  expirationDate: "2026-09-28",
  createdDate: "2026-09-12",
};

export function getMockIngredientDetail(
  ingredientId: string,
): MockIngredientDetail {
  return (
    mockIngredientDetails.find(
      (ingredient) => ingredient.ingredientId === ingredientId,
    ) ?? { ...fallbackIngredientDetail, ingredientId }
  );
}
