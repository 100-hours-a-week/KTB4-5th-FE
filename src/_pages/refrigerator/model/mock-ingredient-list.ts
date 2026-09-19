import {
  isStorageFilter,
  type Ingredient,
  type IngredientListFilter,
  type IngredientListQuery,
  type IngredientListSort,
  type IngredientStatus,
} from "@/entities/ingredient";
import { STOCK_TYPE_LIMIT } from "@/shared/config";

// TODO: API 연동 시 `entities/ingredient/api`의 조회 함수와 DTO mapper로 교체한다.
export type MockIngredientList = {
  ingredientsNum: number;
  filteredCount: number;
  refrigeratorCapacity: number;
  ingredients: Ingredient[];
  nextCursor: string | null;
};

const mockIngredients: Ingredient[] = [
  {
    ingredientId: "1",
    name: "두유",
    category: "TOFU_BEAN",
    quantity: 2,
    weightValue: null,
    weightUnit: "NONE",
    storageType: "REFRIGERATED",
    status: "EXPIRED",
    daysUntilExpiration: -6,
  },
  {
    ingredientId: "2",
    name: "애호박",
    category: "VEGETABLE",
    quantity: 1,
    weightValue: null,
    weightUnit: "NONE",
    storageType: "REFRIGERATED",
    status: "EXPIRED",
    daysUntilExpiration: -3,
  },
  {
    ingredientId: "3",
    name: "달걀",
    category: "OTHER",
    quantity: 10,
    weightValue: null,
    weightUnit: "NONE",
    storageType: "REFRIGERATED",
    status: "EXPIRED",
    daysUntilExpiration: -2,
  },
  {
    ingredientId: "4",
    name: "두부",
    category: "TOFU_BEAN",
    quantity: 2,
    weightValue: 300,
    weightUnit: "G",
    storageType: "REFRIGERATED",
    status: "EXPIRING_SOON",
    daysUntilExpiration: 0,
  },
  {
    ingredientId: "5",
    name: "우유",
    category: "DAIRY",
    quantity: 1,
    weightValue: 900,
    weightUnit: "ML",
    storageType: "REFRIGERATED",
    status: "EXPIRING_SOON",
    daysUntilExpiration: 1,
  },
  {
    ingredientId: "6",
    name: "닭가슴살",
    category: "MEAT",
    quantity: 4,
    weightValue: 400,
    weightUnit: "G",
    storageType: "FROZEN",
    status: "NORMAL",
    daysUntilExpiration: 12,
  },
  {
    ingredientId: "7",
    name: "만두",
    category: "PROCESSED_FOOD",
    quantity: 1,
    weightValue: null,
    weightUnit: "NONE",
    storageType: "FROZEN",
    status: "NORMAL",
    daysUntilExpiration: 40,
  },
  {
    ingredientId: "8",
    name: "간장",
    category: "SEASONING",
    quantity: 1,
    weightValue: 500,
    weightUnit: "ML",
    storageType: "REFRIGERATED",
    status: "NORMAL",
    daysUntilExpiration: 120,
  },
];

const statusGroupOrder = {
  EXPIRED: 0,
  EXPIRING_SOON: 1,
  NORMAL: 2,
} satisfies Record<IngredientStatus, number>;

function matchesFilter(
  ingredient: Ingredient,
  filter: IngredientListFilter | null,
): boolean {
  if (filter === null) {
    return true;
  }

  return isStorageFilter(filter)
    ? ingredient.storageType === filter
    : ingredient.status === filter;
}

function compareIngredients(
  a: Ingredient,
  b: Ingredient,
  sort: IngredientListSort,
): number {
  const groupGap = statusGroupOrder[a.status] - statusGroupOrder[b.status];

  if (groupGap !== 0) {
    return groupGap;
  }

  if (sort === "NAME_ASC") {
    return a.name.localeCompare(b.name, "ko");
  }

  if (sort === "CREATED_DESC") {
    return Number(b.ingredientId) - Number(a.ingredientId);
  }

  return a.daysUntilExpiration - b.daysUntilExpiration;
}

export function getMockIngredientList(
  query: IngredientListQuery,
): MockIngredientList {
  const filtered = mockIngredients
    .filter((ingredient) => matchesFilter(ingredient, query.filter))
    .sort((a, b) => compareIngredients(a, b, query.sort));

  return {
    ingredientsNum: mockIngredients.length,
    filteredCount: filtered.length,
    refrigeratorCapacity: STOCK_TYPE_LIMIT,
    ingredients: filtered,
    nextCursor: null,
  };
}

/**
 * 만료 일괄 처리 진입점에 쓰는 요약이다.
 * 재고 목록 조회 응답에는 만료 수량 합계가 없어 백엔드 확인이 필요하다.
 */
export function getMockExpiredSummary(): {
  count: number;
  totalQuantity: number;
} {
  const expired = mockIngredients.filter(
    (ingredient) => ingredient.status === "EXPIRED",
  );

  return {
    count: expired.length,
    totalQuantity: expired.reduce(
      (total, ingredient) => total + ingredient.quantity,
      0,
    ),
  };
}
