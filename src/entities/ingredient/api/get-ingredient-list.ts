import { requestJson } from "@/shared/api";

import type { Ingredient } from "../model/ingredient";
import type { IngredientListQuery } from "../model/ingredient-list-query";

export const INGREDIENT_LIST_PAGE_SIZE = 10;

type IngredientListItemDto = Omit<Ingredient, "measureType">;

type IngredientListResponseDto = {
  ingredientsNum: number;
  filteredCount: number;
  refrigeratorCapacity: number;
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

export async function getIngredientList({
  refrigeratorId,
  query,
  cursor,
  signal,
}: GetIngredientListParams): Promise<IngredientListPage> {
  const params = new URLSearchParams({
    size: String(INGREDIENT_LIST_PAGE_SIZE),
  });

  if (query.filter) params.set("filter", query.filter);
  params.set("sort", query.sort);
  if (cursor !== null && cursor !== undefined) params.set("cursor", cursor);

  const response = await requestJson<IngredientListResponseDto>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/ingredients?${params}`,
    { signal },
  );

  return {
    ...response.data,
    ingredients: response.data.ingredients.map((ingredient) => ({
      ...ingredient,
      measureType: ingredient.weightUnit === "NONE" ? "COUNT" : "WEIGHT",
    })),
  };
}
