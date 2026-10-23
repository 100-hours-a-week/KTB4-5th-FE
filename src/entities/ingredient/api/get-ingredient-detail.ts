import { ApiError, requestJsonWithHeaders } from "@/shared/api";

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
  if (
    !/^[1-9]\d{0,18}$/.test(ingredientId) ||
    BigInt(ingredientId) > BigInt("9223372036854775807")
  ) {
    throw new ApiError(400, {
      code: "GLOBAL-400-001",
      title: "재고 ID가 올바르지 않아요",
    });
  }
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
