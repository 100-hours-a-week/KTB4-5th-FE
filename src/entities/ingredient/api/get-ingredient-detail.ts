import { requestJsonWithHeaders } from "@/shared/api";

import type { IngredientDetail } from "../model/ingredient";

type IngredientDetailResponseDto = Omit<IngredientDetail, "weightValue"> & {
  baseDate: string;
  weightValue: string | null;
};

export type IngredientDetailView = {
  baseDate: string;
  ingredient: IngredientDetail;
  etag: string | null;
};

type GetIngredientDetailParams = {
  ingredientId: string;
  signal?: AbortSignal;
};

export async function getIngredientDetail({
  ingredientId,
  signal,
}: GetIngredientDetailParams): Promise<IngredientDetailView> {
  const { body, headers } =
    await requestJsonWithHeaders<IngredientDetailResponseDto>(
      `/ingredients/${encodeURIComponent(ingredientId)}`,
      { signal },
    );

  const { baseDate, weightValue, ...ingredient } = body.data;

  return {
    baseDate,
    ingredient: {
      ...ingredient,
      weightValue: weightValue === null ? null : Number(weightValue),
    },
    etag: headers.get("ETag"),
  };
}
