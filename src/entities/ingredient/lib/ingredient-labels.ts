import type {
  IngredientCategory,
  IngredientMeasureType,
  IngredientStatus,
  IngredientStorageType,
  IngredientWeightUnit,
} from "../model/ingredient";
import type {
  IngredientListFilter,
  IngredientListSort,
} from "../model/ingredient-list-query";

export const INGREDIENT_QUANTITY_UNIT = "개";

export const INGREDIENT_CATEGORY_LABELS = {
  VEGETABLE: "채소",
  FRUIT: "과일",
  MEAT: "육류",
  SEAFOOD: "수산물",
  DAIRY: "유제품",
  TOFU_BEAN: "두부·콩",
  GRAINS_NOODLE: "곡물·면",
  PROCESSED_FOOD: "가공식품",
  SEASONING: "양념·소스",
  BEVERAGE: "음료",
  OTHER: "기타",
} satisfies Record<IngredientCategory, string>;

export const INGREDIENT_MEASURE_TYPE_LABELS = {
  COUNT: "개수",
  WEIGHT: "무게·부피",
} satisfies Record<IngredientMeasureType, string>;

export const INGREDIENT_STORAGE_TYPE_LABELS = {
  REFRIGERATED: "냉장",
  FROZEN: "냉동",
} satisfies Record<IngredientStorageType, string>;

export const INGREDIENT_STATUS_LABELS = {
  NORMAL: "여유",
  EXPIRING_SOON: "임박",
  EXPIRED: "만료",
} satisfies Record<IngredientStatus, string>;

export const INGREDIENT_WEIGHT_UNIT_LABELS = {
  NONE: "",
  G: "g",
  ML: "ml",
} satisfies Record<IngredientWeightUnit, string>;

export const INGREDIENT_LIST_FILTER_LABELS = {
  ...INGREDIENT_STORAGE_TYPE_LABELS,
  ...INGREDIENT_STATUS_LABELS,
} satisfies Record<IngredientListFilter, string>;

export const INGREDIENT_LIST_SORT_LABELS = {
  EXPIRATION_ASC: "유통기한 순",
  CREATED_DESC: "등록일 순",
  NAME_ASC: "이름 순",
} satisfies Record<IngredientListSort, string>;
