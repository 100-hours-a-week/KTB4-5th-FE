export const INGREDIENT_STORAGE_TYPES = ["REFRIGERATED", "FROZEN"] as const;
export type IngredientStorageType = (typeof INGREDIENT_STORAGE_TYPES)[number];

export const INGREDIENT_STATUSES = [
  "NORMAL",
  "EXPIRING_SOON",
  "EXPIRED",
] as const;
export type IngredientStatus = (typeof INGREDIENT_STATUSES)[number];

export const INGREDIENT_CATEGORIES = [
  "VEGETABLE",
  "FRUIT",
  "MEAT",
  "SEAFOOD",
  "DAIRY",
  "TOFU_BEAN",
  "GRAINS_NOODLE",
  "PROCESSED_FOOD",
  "SEASONING",
  "BEVERAGE",
  "OTHER",
] as const;
export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

export const INGREDIENT_WEIGHT_UNITS = ["NONE", "G", "ML"] as const;
export type IngredientWeightUnit = (typeof INGREDIENT_WEIGHT_UNITS)[number];

export const INGREDIENT_MEASURE_TYPES = ["COUNT", "WEIGHT"] as const;
export type IngredientMeasureType = (typeof INGREDIENT_MEASURE_TYPES)[number];

export const INGREDIENT_REGISTRATION_SOURCES = ["DIRECT"] as const;
export type IngredientRegistrationSource =
  (typeof INGREDIENT_REGISTRATION_SOURCES)[number];

export type Ingredient = {
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  measureType: IngredientMeasureType;
  quantity: number;
  weightValue: number | null;
  weightUnit: IngredientWeightUnit;
  storageType: IngredientStorageType;
  status: IngredientStatus;
  daysUntilExpiration: number;
};

export type IngredientDetail = {
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  storageType: IngredientStorageType;
  measureType: IngredientMeasureType;
  quantity: number | null;
  weightValue: number | null;
  weightUnit: IngredientWeightUnit;
  expirationDate: string;
  createdDate: string;
  registrationSource: IngredientRegistrationSource;
  status: IngredientStatus;
  daysUntilExpiration: number;
};
