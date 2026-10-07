import type { RegisterIngredientItem } from "@/entities/ingredient";

import type { IngredientDraftValues } from "@/widgets/ingredient-draft-form";

export function toRegisterIngredientItems(
  drafts: readonly IngredientDraftValues[],
): RegisterIngredientItem[] {
  return drafts.map((draft) => {
    // 무게는 선택 입력이고, 입력하면 무게 재고가 된다.
    const measureType = draft.weightValue === null ? "COUNT" : "WEIGHT";

    return {
      name: draft.name,
      category: draft.category,
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
