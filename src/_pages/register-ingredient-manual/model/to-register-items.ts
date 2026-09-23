import type { RegisterIngredientItem } from "@/entities/ingredient";

import type { ManualIngredientDraftValues } from "./manual-register-form-schema";

// 직접 쓰기 화면은 분류를 입력받지 않으므로 기타로 보낸다.
const MANUAL_CATEGORY = "OTHER";

export function toRegisterIngredientItems(
  drafts: readonly ManualIngredientDraftValues[],
): RegisterIngredientItem[] {
  return drafts.map((draft) => {
    // 무게는 선택 입력이고, 입력하면 무게 재고로 등록한다.
    const measureType = draft.weightValue === null ? "COUNT" : "WEIGHT";

    return {
      name: draft.name,
      category: MANUAL_CATEGORY,
      storageType: draft.storageType,
      measureType,
      // 수량과 무게는 측정 방식에 맞는 한쪽만 값을 보낸다.
      quantity: measureType === "COUNT" ? draft.quantity : null,
      weightValue: draft.weightValue,
      weightUnit: draft.weightUnit,
      expirationDate: draft.expirationDate,
      registrationSource: "DIRECT",
      imageUploadId: null,
    };
  });
}
