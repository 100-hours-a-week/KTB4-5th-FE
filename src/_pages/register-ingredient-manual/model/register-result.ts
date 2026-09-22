import type {
  IngredientMeasureType,
  IngredientStorageType,
  IngredientWeightUnit,
} from "@/entities/ingredient";
import { getMockIngredientList } from "@/entities/ingredient";
import { normalizeIngredientName } from "@/features/ingredient-form";
import {
  addDaysToIsoDate,
  getTodayInSeoul,
} from "@/features/select-expiration-date";
import type { ApiResponse } from "@/shared/api";

import type { ManualIngredientDraftValues } from "./manual-register-form-schema";

export type RegisterMergedItem = {
  ingredientId: number;
  name: string;
  storageType: IngredientStorageType;
  expirationDate: string;
  measureType: IngredientMeasureType;
  previousQuantity: number | null;
  addedQuantity: number | null;
  totalQuantity: number | null;
  previousWeightValue: string | null;
  addedWeightValue: string | null;
  totalWeightValue: string | null;
  weightUnit: IngredientWeightUnit;
};

export type RegisterBatchResult = {
  createdCount: number;
  mergedCount: number;
  ingredientsNum: number;
  refrigeratorCapacity: number;
  mergedItems: RegisterMergedItem[];
};

function toDecimalString(value: number) {
  return value.toFixed(3);
}

function getDraftMeasureType(
  draft: ManualIngredientDraftValues,
): IngredientMeasureType {
  return draft.weightValue === null ? "COUNT" : "WEIGHT";
}

function getMergedItems(
  drafts: readonly ManualIngredientDraftValues[],
): RegisterMergedItem[] {
  const { ingredients } = getMockIngredientList({
    filter: null,
    sort: "EXPIRATION_ASC",
  });
  const today = getTodayInSeoul();

  return drafts.flatMap<RegisterMergedItem>((draft) => {
    const measureType = getDraftMeasureType(draft);
    const existingIngredient = ingredients.find((ingredient) => {
      const expirationDate = addDaysToIsoDate(
        today,
        ingredient.daysUntilExpiration,
      );

      return (
        normalizeIngredientName(ingredient.name) ===
          normalizeIngredientName(draft.name) &&
        ingredient.storageType === draft.storageType &&
        expirationDate === draft.expirationDate &&
        ingredient.measureType === measureType &&
        (measureType === "COUNT" || ingredient.weightUnit === draft.weightUnit)
      );
    });

    if (!existingIngredient) {
      return [];
    }

    if (measureType === "COUNT") {
      return [
        {
          ingredientId: Number(existingIngredient.ingredientId),
          name: existingIngredient.name,
          storageType: existingIngredient.storageType,
          expirationDate: draft.expirationDate,
          measureType,
          previousQuantity: existingIngredient.quantity,
          addedQuantity: draft.quantity,
          totalQuantity: existingIngredient.quantity + draft.quantity,
          previousWeightValue: null,
          addedWeightValue: null,
          totalWeightValue: null,
          weightUnit: "NONE" as const,
        },
      ];
    }

    const previousWeightValue = existingIngredient.weightValue;
    const addedWeightValue = draft.weightValue;

    if (previousWeightValue === null || addedWeightValue === null) {
      return [];
    }

    return [
      {
        ingredientId: Number(existingIngredient.ingredientId),
        name: existingIngredient.name,
        storageType: existingIngredient.storageType,
        expirationDate: draft.expirationDate,
        measureType,
        previousQuantity: null,
        addedQuantity: null,
        totalQuantity: null,
        previousWeightValue: toDecimalString(previousWeightValue),
        addedWeightValue: toDecimalString(addedWeightValue),
        totalWeightValue: toDecimalString(
          previousWeightValue + addedWeightValue,
        ),
        weightUnit: draft.weightUnit,
      },
    ];
  });
}

// TODO: 실제 일괄 등록 API 함수로 교체한다. 화면은 같은 성공 응답 data를 사용한다.
export async function registerIngredientsMock(
  drafts: readonly ManualIngredientDraftValues[],
): Promise<ApiResponse<RegisterBatchResult>> {
  await new Promise<void>((resolve) => setTimeout(resolve, 700));

  const { ingredientsNum, refrigeratorCapacity } = getMockIngredientList({
    filter: null,
    sort: "EXPIRATION_ASC",
  });
  const mergedItems = getMergedItems(drafts);
  const createdCount = drafts.length - mergedItems.length;

  return {
    code: "INGREDIENT-201-001",
    message: "재고 일괄등록 성공",
    data: {
      createdCount,
      mergedCount: mergedItems.length,
      ingredientsNum: ingredientsNum + createdCount,
      refrigeratorCapacity,
      mergedItems,
    },
  };
}
