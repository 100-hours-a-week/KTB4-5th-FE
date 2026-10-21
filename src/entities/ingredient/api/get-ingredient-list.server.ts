import "server-only";

import { API_BASE_PATH, ApiError, readProblem } from "@/shared/api";
import type { ApiResponse } from "@/shared/api";

import type { IngredientListQuery } from "../model/ingredient-list-query";
import {
  type IngredientListPage,
  type IngredientListResponseDto,
  toIngredientListPage,
  toIngredientListSearchParams,
} from "./get-ingredient-list";

const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8080" : null);

export function canGetIngredientListOnServer(): boolean {
  return BACKEND_ORIGIN !== null;
}

type GetIngredientListOnServerParams = {
  refrigeratorId: string;
  query: IngredientListQuery;
  cookie: string;
};

type FetchIngredientListPageParams = GetIngredientListOnServerParams & {
  cursor: string | null;
  signal: AbortSignal;
};

async function fetchIngredientListPage({
  refrigeratorId,
  query,
  cookie,
  cursor,
  signal,
}: FetchIngredientListPageParams): Promise<
  ApiResponse<IngredientListResponseDto>
> {
  const response = await fetch(
    `${BACKEND_ORIGIN}${API_BASE_PATH}/refrigerators/${encodeURIComponent(refrigeratorId)}/ingredients?${toIngredientListSearchParams(query, cursor)}`,
    {
      headers: {
        Accept: "application/json, application/problem+json",
        Cookie: cookie,
      },
      cache: "no-store",
      signal,
    },
  );
  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response));
  }

  return (await response.json()) as ApiResponse<IngredientListResponseDto>;
}

export async function getIngredientListOnServer(
  params: GetIngredientListOnServerParams,
): Promise<IngredientListPage> {
  const body = await fetchIngredientListPage({
    ...params,
    cursor: null,
    signal: AbortSignal.timeout(500),
  });
  return toIngredientListPage(body.data);
}

export async function getAllIngredientListOnServer(
  params: GetIngredientListOnServerParams & { signal: AbortSignal },
): Promise<ApiResponse<IngredientListResponseDto>> {
  const first = await fetchIngredientListPage({ ...params, cursor: null });
  const ingredients = [...first.data.ingredients];
  const seenCursors = new Set<string>();
  let cursor = first.data.nextCursor;

  while (cursor !== null) {
    if (seenCursors.has(cursor)) {
      throw new TypeError("재고 목록의 페이지 커서가 반복되었습니다.");
    }
    seenCursors.add(cursor);

    const page = await fetchIngredientListPage({ ...params, cursor });
    ingredients.push(...page.data.ingredients);
    cursor = page.data.nextCursor;
  }

  return { ...first, data: { ...first.data, ingredients, nextCursor: null } };
}
