import { requestJsonWithHeaders } from "@/shared/api";

import type {
  IngredientCategory,
  IngredientDetail,
  IngredientStorageType,
  IngredientWeightUnit,
} from "../model/ingredient";

export type UpdateIngredientBody = Partial<{
  name: string;
  category: IngredientCategory;
  storageType: IngredientStorageType;
  quantity: number;
  weightValue: string;
  weightUnit: IngredientWeightUnit;
  expirationDate: string;
}>;

type IngredientDetailResponseDto = Omit<IngredientDetail, "weightValue"> & {
  weightValue: string | null;
};

export async function updateIngredient({
  ingredientId,
  etag,
  body,
}: {
  ingredientId: string;
  etag: string;
  body: UpdateIngredientBody;
}): Promise<{ ingredient: IngredientDetail; etag: string | null }> {
  const response = await requestJsonWithHeaders<IngredientDetailResponseDto>(
    `/ingredients/${encodeURIComponent(ingredientId)}`,
    { method: "PATCH", headers: { "If-Match": etag }, json: body },
  );

  return {
    ingredient: {
      ...response.body.data,
      weightValue:
        response.body.data.weightValue === null
          ? null
          : Number(response.body.data.weightValue),
    },
    etag: response.headers.get("ETag"),
  };
}
