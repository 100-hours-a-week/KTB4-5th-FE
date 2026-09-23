import type { RegisterIngredientItem } from "@/entities/ingredient";

import type { ManualIngredientDraftValues } from "./manual-register-form-schema";

// 직접 쓰기 화면은 분류를 입력받지 않으므로 기타로 보낸다.
const MANUAL_CATEGORY = "OTHER";

export function toRegisterIngredientItems(
  drafts: readonly ManualIngredientDraftValues[],
): RegisterIngredientItem[] {
  return drafts.map((draft) => {
    // 무게는 선택 입력이고, 입력하면 무게 재고가 된다.
    const measureType = draft.weightValue === null ? "COUNT" : "WEIGHT";

    return {
      name: draft.name,
      category: MANUAL_CATEGORY,
      storageType: draft.storageType,
      measureType,
      quantity: measureType === "COUNT" ? draft.quantity : null,
      weightValue: draft.weightValue,
      weightUnit: draft.weightUnit,
      expirationDate: draft.expirationDate,
      registrationSource: "DIRECT",
    };
  });
}
