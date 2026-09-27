import { requestJsonWithHeaders } from "@/shared/api";

import type { IngredientDetail } from "../model/ingredient";

type IngredientDetailResponseDto = Omit<IngredientDetail, "weightValue"> & {
  weightValue: string | null;
};

export type IngredientDetailView = {
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

  return {
    ingredient: {
      ...body.data,
      weightValue:
        body.data.weightValue === null ? null : Number(body.data.weightValue),
    },
    etag: headers.get("ETag"),
  };
}
