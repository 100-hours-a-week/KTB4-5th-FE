import {
  INGREDIENT_STORAGE_TYPES,
  type IngredientStorageType,
} from "./ingredient";

export const INGREDIENT_LIST_FILTERS = [
  "REFRIGERATED",
  "FROZEN",
  "NORMAL",
  "EXPIRING_SOON",
  "EXPIRED",
] as const;
export type IngredientListFilter = (typeof INGREDIENT_LIST_FILTERS)[number];

export const INGREDIENT_LIST_SORTS = [
  "EXPIRATION_ASC",
  "CREATED_DESC",
  "NAME_ASC",
] as const;
export type IngredientListSort = (typeof INGREDIENT_LIST_SORTS)[number];

export const DEFAULT_INGREDIENT_LIST_SORT: IngredientListSort =
  "EXPIRATION_ASC";

export type IngredientListQuery = {
  filter: IngredientListFilter | null;
  sort: IngredientListSort;
};

export type RawQueryParams = Record<string, string | string[] | undefined>;

const INGREDIENT_LIST_QUERY_KEYS = {
  filter: "filter",
  sort: "sort",
} as const;

function readSingleValue(value: string | string[] | undefined): string {
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() ?? "";
}

function readAllowedValue<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | null {
  const single = readSingleValue(value);
  return allowed.includes(single as T) ? (single as T) : null;
}

export function isStorageFilter(
  filter: IngredientListFilter,
): filter is IngredientStorageType {
  return (INGREDIENT_STORAGE_TYPES as readonly string[]).includes(filter);
}

export function parseIngredientListQuery(
  queryParams: RawQueryParams,
): IngredientListQuery {
  return {
    filter: readAllowedValue(
      queryParams[INGREDIENT_LIST_QUERY_KEYS.filter],
      INGREDIENT_LIST_FILTERS,
    ),
    sort:
      readAllowedValue(
        queryParams[INGREDIENT_LIST_QUERY_KEYS.sort],
        INGREDIENT_LIST_SORTS,
      ) ?? DEFAULT_INGREDIENT_LIST_SORT,
  };
}

export function toIngredientListQueryString(
  query: IngredientListQuery,
): string {
  const queryParams = new URLSearchParams();

  if (query.filter) {
    queryParams.set(INGREDIENT_LIST_QUERY_KEYS.filter, query.filter);
  }

  if (query.sort !== DEFAULT_INGREDIENT_LIST_SORT) {
    queryParams.set(INGREDIENT_LIST_QUERY_KEYS.sort, query.sort);
  }

  return queryParams.toString();
}

export function hasIngredientListCondition(
  query: IngredientListQuery,
): boolean {
  return query.filter !== null;
}
