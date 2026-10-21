import { requestJson } from "@/shared/api";

import type { Ingredient } from "../model/ingredient";
import type { IngredientListQuery } from "../model/ingredient-list-query";

export const INGREDIENT_LIST_PAGE_SIZE = 10;

type IngredientListItemDto = Omit<Ingredient, "measureType" | "weightValue"> & {
  weightValue: string | null;
};

export type IngredientListResponseDto = {
  baseDate: string;
  outdated: boolean;
  ingredientsNum: number;
  filteredCount: number;
  refrigeratorCapacity: number;
  refrigeratorName: string;
  ingredients: IngredientListItemDto[];
  nextCursor: string | null;
};

export type IngredientListPage = Omit<
  IngredientListResponseDto,
  "ingredients"
> & {
  ingredients: Ingredient[];
};

type GetIngredientListParams = {
  refrigeratorId: string;
  query: IngredientListQuery;
  cursor?: string | null;
  signal?: AbortSignal;
};

export function toIngredientListSearchParams(
  query: IngredientListQuery,
  cursor?: string | null,
): URLSearchParams {
  const params = new URLSearchParams({
    size: String(INGREDIENT_LIST_PAGE_SIZE),
  });

  if (query.filter) params.set("filter", query.filter);
  if (query.category) params.set("category", query.category);
  params.set("sort", query.sort);
  if (query.keyword) params.set("keyword", query.keyword);
  if (cursor !== null && cursor !== undefined) params.set("cursor", cursor);

  return params;
}

export function toIngredientListPage(
  data: IngredientListResponseDto,
): IngredientListPage {
  return {
    ...data,
    ingredients: data.ingredients.map((ingredient) => ({
      ...ingredient,
      weightValue:
        ingredient.weightValue === null ? null : Number(ingredient.weightValue),
      measureType: ingredient.weightUnit === "NONE" ? "COUNT" : "WEIGHT",
    })),
  };
}

export async function getIngredientList({
  refrigeratorId,
  query,
  cursor,
  signal,
}: GetIngredientListParams): Promise<IngredientListPage> {
  const response = await requestJson<IngredientListResponseDto>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/ingredients?${toIngredientListSearchParams(query, cursor)}`,
    { signal },
  );

  return toIngredientListPage(response.data);
}

export async function getExpiredIngredients({
  refrigeratorId,
  query,
  signal,
}: Omit<GetIngredientListParams, "cursor">): Promise<IngredientListPage> {
  const response = await requestJson<IngredientListResponseDto>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/expired-ingredients?${toIngredientListSearchParams(query)}`,
    { basePath: "", signal },
  );

  return toIngredientListPage(response.data);
}
