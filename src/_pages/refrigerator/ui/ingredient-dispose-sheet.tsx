"use client";

import { useState } from "react";

import { type Ingredient } from "@/entities/ingredient";
import { AppBottomSheet } from "@/shared/ui/app-bottom-sheet";
import { AppDialog } from "@/shared/ui/app-dialog";

import { IngredientDisposeBottomSheetContent } from "./ingredient-dispose-sheet-content";

type IngredientDisposeBottomSheetProps = {
  open: boolean;
  refrigeratorId: string;
  ingredients: Ingredient[];
  onClose: () => void;
};

export function IngredientDisposeBottomSheet({
  open,
  ingredients,
  onClose,
}: IngredientDisposeBottomSheetProps) {
  const [confirmCount, setConfirmCount] = useState<number | null>(null);

  function openConfirm(selectedCount: number) {
    onClose();
    setConfirmCount(selectedCount);
  }

  return (
    <>
      <AppBottomSheet open={open} onDismiss={onClose}>
        {/* 닫히면 내용이 unmount되므로 열 때마다 선택값이 전체 선택으로 초기화된다. */}
        <IngredientDisposeBottomSheetContent
          ingredients={ingredients}
          onCancel={onClose}
          onConfirm={openConfirm}
        />
      </AppBottomSheet>
      <AppDialog
        open={confirmCount !== null}
        title={`만료 재료 ${confirmCount ?? 0}종을 폐기할까요?`}
        description="선택한 재료의 보유 수량을 모두 폐기해요. 폐기한 재료는 되돌릴 수 없어요."
        secondaryAction={{
          label: "취소",
          onClick: () => setConfirmCount(null),
        }}
        primaryAction={{
          label: "폐기하기",
          onClick: () => setConfirmCount(null),
        }}
      />
    </>
  );
}
