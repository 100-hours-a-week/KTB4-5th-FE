"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import {
  expireIngredient,
  ingredientQueries,
  type ExpireIngredientBody,
  type IngredientDetail,
} from "@/entities/ingredient";
import { ApiError } from "@/shared/api";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppBottomSheet } from "@/shared/ui/app-bottom-sheet";
import { AppLink } from "@/shared/ui/app-link";
import { showAppToast } from "@/shared/ui/app-toast";

import { getExpireErrorMessage } from "../model/expire-error-message";
import { IngredientExpireSheetContent } from "./ingredient-expire-sheet-content";

type IngredientDetailActionsProps = {
  ingredient: IngredientDetail;
  etag: string | null;
  refrigeratorId: string;
};

export function IngredientDetailActions({
  ingredient,
  etag,
  refrigeratorId,
}: IngredientDetailActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync: mutateExpire } = useMutation({
    mutationFn: expireIngredient,
  });
  const [isExpireSheetOpen, setIsExpireSheetOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const submittingRef = useRef(false);

  async function handleExpire() {
    if (submittingRef.current) {
      return;
    }

    if (!etag || etag.startsWith("W/")) {
      showAppToast({
        message: "재고 버전 정보가 없어요. 다시 불러와 주세요",
        variant: "error",
      });
      setIsExpireSheetOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ingredientQueries.detail(
          refrigeratorId,
          ingredient.ingredientId,
        ).queryKey,
      });
      return;
    }

    const body: ExpireIngredientBody | null =
      ingredient.measureType === "WEIGHT"
        ? ingredient.weightValue !== null
          ? { weightValue: String(ingredient.weightValue) }
          : null
        : ingredient.quantity !== null
          ? { quantity: ingredient.quantity }
          : null;

    if (!body) {
      showAppToast({
        message: "처리할 재고 값을 확인해 주세요",
        variant: "error",
      });
      setIsExpireSheetOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ingredientQueries.detail(
          refrigeratorId,
          ingredient.ingredientId,
        ).queryKey,
      });
      return;
    }

    submittingRef.current = true;
    setIsPending(true);

    try {
      const result = await mutateExpire({
        ingredientId: ingredient.ingredientId,
        etag,
        body,
      });
      setIsExpireSheetOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ingredientQueries.byRefrigerator(refrigeratorId),
        refetchType: "inactive",
      });

      showAppToast({ message: "재고를 처리했어요.", variant: "success" });
      if (!result.removed) {
        submittingRef.current = false;
        setIsPending(false);
        void queryClient.invalidateQueries({
          queryKey: ingredientQueries.detail(
            refrigeratorId,
            ingredient.ingredientId,
          ).queryKey,
        });
        return;
      }

      const href = routes.refrigerator;

      markAppNavigationIntent("replace", href);
      router.replace(href);
    } catch (error) {
      submittingRef.current = false;
      setIsPending(false);
      const message = getExpireErrorMessage(error);
      if (message) showAppToast({ message, variant: "error" });

      if (
        error instanceof ApiError &&
        (error.status === 412 || error.status === 428)
      ) {
        setIsExpireSheetOpen(false);
        void queryClient.invalidateQueries({
          queryKey: ingredientQueries.detail(
            refrigeratorId,
            ingredient.ingredientId,
          ).queryKey,
        });
      }

      if (error instanceof ApiError && error.status === 404) {
        void queryClient.invalidateQueries({
          queryKey: ingredientQueries.byRefrigerator(refrigeratorId),
          refetchType: "inactive",
        });
        const href = routes.refrigerator;
        markAppNavigationIntent("replace", href);
        router.replace(href);
      }
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
