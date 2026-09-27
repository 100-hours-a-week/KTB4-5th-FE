"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import {
  disposeExpiredIngredients,
  ingredientQueries,
  type Ingredient,
} from "@/entities/ingredient";
import { refrigeratorQueries } from "@/entities/refrigerator";
import { AppBottomSheet } from "@/shared/ui/app-bottom-sheet";
import { AppDialog } from "@/shared/ui/app-dialog";
import { showAppToast } from "@/shared/ui/app-toast";

import { getDisposeExpiredErrorMessage } from "../model/dispose-expired-error-message";
import { IngredientDisposeBottomSheetContent } from "./ingredient-dispose-sheet-content";

type IngredientDisposeBottomSheetProps = {
  open: boolean;
  refrigeratorId: string;
  ingredients: Ingredient[];
  onClose: () => void;
};

type PendingDisposal = {
  refrigeratorId: string;
  ingredientIds: string[];
};

export function IngredientDisposeBottomSheet({
  open,
  refrigeratorId,
  ingredients,
  onClose,
}: IngredientDisposeBottomSheetProps) {
  const queryClient = useQueryClient();
  const [pendingDisposal, setPendingDisposal] =
    useState<PendingDisposal | null>(null);
  const submittingRef = useRef(false);
  const { mutateAsync, isPending } = useMutation({
    mutationFn: disposeExpiredIngredients,
  });

  function openConfirm(ingredientIds: string[]) {
    onClose();
    setPendingDisposal({ refrigeratorId, ingredientIds });
  }

  function closeConfirm() {
    if (!submittingRef.current) {
      setPendingDisposal(null);
    }
  }

  async function disposeSelectedIngredients() {
    if (submittingRef.current || !pendingDisposal?.ingredientIds.length) {
      return;
    }

    submittingRef.current = true;

    try {
      await mutateAsync(pendingDisposal);
      setPendingDisposal(null);

      void queryClient.invalidateQueries({
        queryKey: ingredientQueries.byRefrigerator(
          pendingDisposal.refrigeratorId,
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: refrigeratorQueries.current().queryKey,
      });
      showAppToast({
        message: "만료 재료 정리를 완료했어요.",
        variant: "success",
      });
    } catch (error) {
      const message = getDisposeExpiredErrorMessage(error);
      if (message) {
        showAppToast({ message, variant: "error" });
      }
    } finally {
      submittingRef.current = false;
    }
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
        open={pendingDisposal !== null}
        title={`만료 재료 ${pendingDisposal?.ingredientIds.length ?? 0}종을 폐기할까요?`}
        description="선택한 재료의 보유 수량을 모두 폐기해요. 폐기한 재료는 되돌릴 수 없어요."
        dismissBehavior={isPending ? "none" : "secondary-action"}
        secondaryAction={{
          label: "취소",
          disabled: isPending,
          onClick: closeConfirm,
        }}
        primaryAction={{
          label: isPending ? "처리 중..." : "폐기하기",
          disabled: isPending,
          onClick: () => void disposeSelectedIngredients(),
        }}
      />
    </>
  );
}
