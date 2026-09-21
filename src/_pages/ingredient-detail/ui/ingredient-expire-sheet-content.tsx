import {
  INGREDIENT_QUANTITY_UNIT,
  INGREDIENT_WEIGHT_UNIT_LABELS,
} from "@/entities/ingredient";
import {
  AppBottomSheetDescription,
  AppBottomSheetTitle,
} from "@/shared/ui/app-bottom-sheet";
import { FooterButton } from "@/shared/ui/footer-button";

import type { MockIngredientDetail } from "../model/mock-ingredient-detail";

type IngredientExpireSheetContentProps = {
  ingredient: MockIngredientDetail;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function formatExpireAmount(ingredient: MockIngredientDetail) {
  if (
    ingredient.measureType === "WEIGHT" &&
    ingredient.weightValue !== null &&
    ingredient.weightUnit !== "NONE"
  ) {
    return `${ingredient.weightValue}${INGREDIENT_WEIGHT_UNIT_LABELS[ingredient.weightUnit]}`;
  }

  return `${ingredient.quantity}${INGREDIENT_QUANTITY_UNIT}`;
}

export function IngredientExpireSheetContent({
  ingredient,
  isPending,
  onCancel,
  onConfirm,
}: IngredientExpireSheetContentProps) {
  function handleSubmit() {
    if (!isPending) {
      onConfirm();
    }
  }

  return (
    <>
      <AppBottomSheetTitle className="m-0 font-app-heading text-[19px] font-black leading-[1.35] tracking-normal">
        {ingredient.name} 만료 처리할까요?
      </AppBottomSheetTitle>

      <AppBottomSheetDescription className="m-[6px_0_0] font-app-body text-[13px] leading-[1.45] text-app-ink/55">
        선택한 재료는 보유 수량 전부가 폐기돼요.
        <br />
        <span className="text-app-ink">정리한 재료는 되돌릴 수 없어요.</span>
      </AppBottomSheetDescription>

      <p className="m-[18px_0_0] flex items-center gap-3 rounded-[10px] bg-app-neutral-100 px-4 py-[15px]">
        <span className="min-w-0 flex-1 font-app-body text-[14px] leading-none text-app-ink/55">
          처리할 재고
        </span>
        <span className="flex-none font-app-heading text-[16px] font-black leading-none">
          {formatExpireAmount(ingredient)}
        </span>
      </p>

      <div className="mt-[18px] flex gap-[10px]">
        <FooterButton
          variant="secondary"
          onClick={onCancel}
          disabled={isPending}
        >
          취소
        </FooterButton>
        <FooterButton
          disabled={isPending}
          onClick={handleSubmit}
          aria-busy={isPending}
        >
          {isPending ? "처리중..." : "전체 처리하기"}
        </FooterButton>
      </div>
    </>
  );
}
