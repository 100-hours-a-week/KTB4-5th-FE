import { requestJsonWithHeaders } from "@/shared/api";

import type {
  IngredientCategory,
  IngredientDetail,
  IngredientMeasureType,
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

type IngredientMergedItemResponseDto = {
  ingredientId: number;
  name: string;
  measureType: IngredientMeasureType;
  previousQuantity: number | null;
  addedQuantity: number | null;
  totalQuantity: number | null;
  previousWeightValue: number | string | null;
  addedWeightValue: number | string | null;
  totalWeightValue: number | string | null;
  weightUnit: IngredientWeightUnit;
};

type IngredientUpdateResponseDto = IngredientDetailResponseDto & {
  mergedItems: IngredientMergedItemResponseDto[];
};

export type UpdateIngredientMergedItem = Omit<
  IngredientMergedItemResponseDto,
  "previousWeightValue" | "addedWeightValue" | "totalWeightValue"
> & {
  previousWeightValue: number | null;
  addedWeightValue: number | null;
  totalWeightValue: number | null;
};

export type UpdateIngredientResult = {
  ingredient: IngredientDetail;
  mergedItems: UpdateIngredientMergedItem[];
  etag: string | null;
};

function toNumberOrNull(value: number | string | null): number | null {
  return value === null ? null : Number(value);
}

export async function updateIngredient({
  ingredientId,
  etag,
  body,
}: {
  ingredientId: string;
  etag: string;
  body: UpdateIngredientBody;
}): Promise<UpdateIngredientResult> {
  const response = await requestJsonWithHeaders<IngredientUpdateResponseDto>(
    `/ingredients/${encodeURIComponent(ingredientId)}`,
    { method: "PATCH", headers: { "If-Match": etag }, json: body },
  );

  const { mergedItems, ...ingredient } = response.body.data;

  return {
    ingredient: {
      ...ingredient,
      weightValue:
        ingredient.weightValue === null ? null : Number(ingredient.weightValue),
    },
    mergedItems: mergedItems.map((item) => ({
      ...item,
      previousWeightValue: toNumberOrNull(item.previousWeightValue),
      addedWeightValue: toNumberOrNull(item.addedWeightValue),
      totalWeightValue: toNumberOrNull(item.totalWeightValue),
    })),
    etag: response.headers.get("ETag"),
  };
}
