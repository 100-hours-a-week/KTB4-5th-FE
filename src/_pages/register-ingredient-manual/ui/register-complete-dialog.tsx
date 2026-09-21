"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";

import type { RegisterBatchResult } from "../model/register-result";

type RegisterCompleteDialogProps = {
  result: RegisterBatchResult | null;
};

/**
 * 등록 결과를 알리는 완료형 모달
 */
export function RegisterCompleteDialog({
  result,
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
  const stockTypeCountAfter = result?.ingredientsNum ?? 0;
  const stockTypeLimit = result?.refrigeratorCapacity ?? 0;
  const remainingTypeCount = Math.max(stockTypeLimit - stockTypeCountAfter, 0);
  const hasMergedItems = (result?.mergedItems.length ?? 0) > 0;

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
        onClick: () =>
          leaveTo(
            hasMergedItems
              ? routes.registerIngredientMergeResult
              : routes.refrigerator,
          ),
      }}
    />
  );
}
