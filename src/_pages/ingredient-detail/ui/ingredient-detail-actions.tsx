"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppBottomSheet } from "@/shared/ui/app-bottom-sheet";
import { AppLink } from "@/shared/ui/app-link";
import { showAppToast } from "@/shared/ui/app-toast";

import type { MockIngredientDetail } from "../model/mock-ingredient-detail";
import { IngredientExpireSheetContent } from "./ingredient-expire-sheet-content";

type IngredientDetailActionsProps = {
  ingredient: MockIngredientDetail;
};

export function IngredientDetailActions({
  ingredient,
}: IngredientDetailActionsProps) {
  const router = useRouter();
  const [isExpireSheetOpen, setIsExpireSheetOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const submittingRef = useRef(false);

  // TODO: API 연동 시 이 재고 행의 남은 재고 전체를 만료 처리한다.
  async function handleExpire() {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setIsPending(true);

    try {
      // 상세 만료 처리 API가 연결되기 전까지 요청 중 상태를 확인하기 위한 목업.
      await new Promise<void>((resolve) => setTimeout(resolve, 700));
      setIsExpireSheetOpen(false);

      const href = routes.refrigerator;

      markAppNavigationIntent("replace", href);
      showAppToast({ message: "재고를 처리했어요.", variant: "success" });
      router.replace(href);
    } catch {
      submittingRef.current = false;
      setIsPending(false);
      showAppToast({ message: "재고 처리에 실패했어요.", variant: "error" });
    }
  }

  function handleExpireClick() {
    if (submittingRef.current) {
      return;
    }

    setIsExpireSheetOpen(true);
  }

  return (
    <>
      <div className="flex gap-2.5">
        <AppLink
          href={routes.ingredientEdit(ingredient.ingredientId)}
          className="inline-flex w-28 flex-none items-center justify-center rounded-[4px] border-[1.5px] border-app-ink bg-app-canvas py-[15px] font-app-heading text-[14px] font-bold leading-[1.2] text-app-ink no-underline hover:bg-app-neutral-100 hover:text-app-ink active:bg-app-neutral-200"
        >
          수정
        </AppLink>
        <button
          type="button"
          onClick={handleExpireClick}
          disabled={isPending}
          aria-busy={isPending}
          className="flex-1 cursor-pointer rounded-[4px] border-0 bg-app-ink py-[15px] font-app-heading text-[14px] font-bold leading-[1.2] text-white hover:bg-app-neutral-800 active:bg-app-neutral-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isPending ? "처리중..." : "만료 처리"}
        </button>
      </div>

      <AppBottomSheet
        open={isExpireSheetOpen}
        onDismiss={() => setIsExpireSheetOpen(false)}
        dismissBehavior={isPending ? "none" : "dismiss"}
      >
        <IngredientExpireSheetContent
          ingredient={ingredient}
          isPending={isPending}
          onCancel={() => setIsExpireSheetOpen(false)}
          onConfirm={() => void handleExpire()}
        />
      </AppBottomSheet>
    </>
  );
}
