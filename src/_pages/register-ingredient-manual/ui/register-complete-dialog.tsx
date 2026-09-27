"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  getIngredientCapacity,
  type RegisterBatchResult,
} from "@/entities/ingredient";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";

type RegisterCompleteDialogProps = {
  result: RegisterBatchResult | null;
  onViewMergeResult: (result: RegisterBatchResult) => void;
};

export function RegisterCompleteDialog({
  result,
  onViewMergeResult,
}: RegisterCompleteDialogProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  function leaveTo(href: string) {
    if (isLeaving) {
      return;
    }

    setIsLeaving(true);
    markAppNavigationIntent("replace", href);
    router.replace(href);
  }

  const registeredTypeCount =
    (result?.createdCount ?? 0) + (result?.mergedCount ?? 0);
  const {
    stockTypeCount: stockTypeCountAfter,
    stockTypeLimit,
    remainingSlots: remainingTypeCount,
  } = getIngredientCapacity({
    ingredientsNum: result?.ingredientsNum ?? 0,
    refrigeratorCapacity: result?.refrigeratorCapacity ?? 0,
  });
  const hasMergedItems = (result?.mergedItems.length ?? 0) > 0;

  function handlePrimaryAction() {
    if (hasMergedItems && result) {
      onViewMergeResult(result);
      leaveTo(routes.registerIngredientMergeResult);
      return;
    }

    leaveTo(routes.refrigerator);
  }

  return (
    <AppDialog
      open={result !== null}
      dismissBehavior="none"
      title={`${registeredTypeCount}종을 등록했어요`}
      description={`냉장고에 재료가 담겼습니다.\n등록 후 ${stockTypeCountAfter} / ${stockTypeLimit}종 · 잔여 ${remainingTypeCount}종`}
      secondaryAction={
        hasMergedItems
          ? undefined
          : {
              label: "계속 등록",
              disabled: isLeaving,
              onClick: () => leaveTo(routes.registerIngredient),
            }
      }
      primaryAction={{
        label: hasMergedItems ? "합산 결과 확인" : "냉장고 보기",
        disabled: isLeaving,
        onClick: handlePrimaryAction,
      }}
    />
  );
}
