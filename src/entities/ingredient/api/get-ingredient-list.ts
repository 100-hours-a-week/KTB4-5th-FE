import { requestJson } from "@/shared/api";

import type { Ingredient } from "../model/ingredient";
import type { IngredientListQuery } from "../model/ingredient-list-query";

export const INGREDIENT_LIST_PAGE_SIZE = 10;

type IngredientListItemDto = Omit<Ingredient, "measureType" | "weightValue"> & {
  weightValue: string | null;
};

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
      weightValue:
        ingredient.weightValue === null ? null : Number(ingredient.weightValue),
      measureType: ingredient.weightUnit === "NONE" ? "COUNT" : "WEIGHT",
    })),
  };
}

export async function getAllIngredients(
  params: Omit<GetIngredientListParams, "cursor">,
): Promise<Ingredient[]> {
  const ingredients: Ingredient[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  do {
    const page = await getIngredientList({ ...params, cursor });
    ingredients.push(...page.ingredients);
    cursor = page.nextCursor;

    if (cursor !== null) {
      if (seenCursors.has(cursor)) {
        throw new TypeError("재고 목록의 페이지 커서가 반복되었습니다.");
      }
      seenCursors.add(cursor);
    }
  } while (cursor !== null);

  return ingredients;
}
