import { getMockIngredientList } from "@/entities/ingredient";
import {
  addDaysToIsoDate,
  getTodayInSeoul,
} from "@/features/select-expiration-date";

import type { IngredientEditFormInput } from "./ingredient-edit-form-schema";
import { toStockKey } from "./stock-key";

/** 같은 품목이 되어 수량이 합쳐질 대상. 중복 합산 확인 모달에서 보여준다. */
export type MergeTarget = {
  ingredientId: string;
  name: string;
  quantity: number;
};

export type IngredientEditTarget = {
  ingredientId: string;
  /** 등록일은 수정할 수 없고 값만 보여준다. */
  createdDate: string;
  initialValues: IngredientEditFormInput;
  /** 이 품목을 뺀 나머지 품목. 저장값이 같아지면 합산 대상이 된다. */
  mergeCandidates: Record<string, MergeTarget>;
};

const FALLBACK_NAME = "대파";
const FALLBACK_DAYS_UNTIL_EXPIRATION = 9;
// TODO: API 연동 시 상세 응답의 등록일로 교체한다.
const MOCK_CREATED_DAYS_AGO = 7;

// TODO: API 연동 시 `entities/ingredient/api`의 상세 조회 함수와 DTO mapper로 교체한다.
export function getMockIngredientEditTarget(
  ingredientId: string,
): IngredientEditTarget {
  const today = getTodayInSeoul();
  const { ingredients } = getMockIngredientList({
    filter: null,
    sort: "EXPIRATION_ASC",
  });
  const target = ingredients.find(
    (ingredient) => ingredient.ingredientId === ingredientId,
  );

  const mergeCandidates: Record<string, MergeTarget> = {};

  for (const ingredient of ingredients) {
    if (ingredient.ingredientId === ingredientId) {
      continue;
    }

    const stockKey = toStockKey(
      ingredient.name,
      ingredient.storageType,
      addDaysToIsoDate(today, ingredient.daysUntilExpiration),
    );

    mergeCandidates[stockKey] = {
      ingredientId: ingredient.ingredientId,
      name: ingredient.name,
      quantity: ingredient.quantity,
    };
  }

  const daysUntilExpiration =
    target?.daysUntilExpiration ?? FALLBACK_DAYS_UNTIL_EXPIRATION;
  // 이미 지난 기한은 캘린더에서 다시 고를 수 없으므로 빈 값으로 두고 재선택을 받는다.
  const expirationDate =
    daysUntilExpiration < 0 ? "" : addDaysToIsoDate(today, daysUntilExpiration);

  return {
    ingredientId,
    createdDate: addDaysToIsoDate(today, -MOCK_CREATED_DAYS_AGO),
    initialValues: {
      name: target?.name ?? FALLBACK_NAME,
      storageType: target?.storageType ?? "REFRIGERATED",
      quantity: String(target?.quantity ?? 1),
      weightValue:
        target?.weightValue === null || target?.weightValue === undefined
          ? ""
          : String(target.weightValue),
      weightUnit: target?.weightUnit === "ML" ? "ML" : "G",
      expirationDate,
    },
    mergeCandidates,
  };
}
