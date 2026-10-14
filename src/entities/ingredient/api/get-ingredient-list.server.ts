import "server-only";

import { API_BASE_PATH } from "@/shared/api";
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

export async function getIngredientListOnServer({
  refrigeratorId,
  query,
  cookie,
}: GetIngredientListOnServerParams): Promise<IngredientListPage> {
  const response = await fetch(
    `${BACKEND_ORIGIN}${API_BASE_PATH}/refrigerators/${encodeURIComponent(refrigeratorId)}/ingredients?${toIngredientListSearchParams(query)}`,
    {
      headers: { Accept: "application/json", Cookie: cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(500),
    },
  );
  if (!response.ok) {
    throw new Error(`재고 목록 서버 조회 실패: ${response.status}`);
  }

  const body = (await response.json()) as ApiResponse<IngredientListResponseDto>;
  return toIngredientListPage(body.data);
}
