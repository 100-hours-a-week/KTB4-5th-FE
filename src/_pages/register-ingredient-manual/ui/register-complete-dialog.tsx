"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";

import type { DraftSummary } from "../model/draft-summary";

type RegisterCompleteDialogProps = {
  summary: DraftSummary | null;
};

/**
 * 등록 결과를 알리는 완료형 모달
 */
export function RegisterCompleteDialog({
  summary,
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

  const registeredTypeCount = summary?.registeredTypeCount ?? 0;
  const stockTypeCountAfter = summary?.stockTypeCountAfter ?? 0;
  const stockTypeLimit = summary?.stockTypeLimit ?? 0;
  const remainingTypeCount = Math.max(stockTypeLimit - stockTypeCountAfter, 0);

  return (
    <AppDialog
      open={summary !== null}
      dismissBehavior="none"
      title={`${registeredTypeCount}종을 등록했어요`}
      description={`냉장고에 재료가 담겼습니다.\n등록 후 ${stockTypeCountAfter} / ${stockTypeLimit}종 · 잔여 ${remainingTypeCount}종`}
      secondaryAction={{
        label: "계속 등록",
        disabled: isLeaving,
        onClick: () => leaveTo(routes.registerIngredient),
      }}
      primaryAction={{
        label: "냉장고 보기",
        disabled: isLeaving,
        onClick: () => leaveTo(routes.refrigerator),
      }}
    />
  );
}
