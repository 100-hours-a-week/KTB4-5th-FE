"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import {
  expireIngredient,
  formatIngredientQuantity,
  formatIngredientWeight,
  invalidateIngredients,
  type ExpireIngredientBody,
  type IngredientDetail,
} from "@/entities/ingredient";
import { ApiError } from "@/shared/api";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";
import { AppLink } from "@/shared/ui/app-link";
import { showAppToast } from "@/shared/ui/app-toast";

import { getExpireErrorMessage } from "../model/expire-error-message";

function formatExpireAmount(ingredient: IngredientDetail) {
  if (ingredient.measureType === "WEIGHT") {
    const weight = formatIngredientWeight(
      ingredient.weightValue,
      ingredient.weightUnit,
    );

    if (weight !== null) {
      return weight;
    }
  }

  return ingredient.quantity === null
    ? "-"
    : formatIngredientQuantity(ingredient.quantity);
}

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
  const [isExpireDialogOpen, setIsExpireDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const submittingRef = useRef(false);
  const actionLabel =
    ingredient.status === "EXPIRED" ? "폐기 처리" : "삭제 처리";

  async function handleExpire() {
    if (submittingRef.current) {
      return;
    }

    if (!etag || etag.startsWith("W/")) {
      showAppToast({
        message: "재고 버전 정보가 없어요. 다시 불러와 주세요",
        variant: "error",
      });
      setIsExpireDialogOpen(false);
      void invalidateIngredients(queryClient, refrigeratorId);
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
      setIsExpireDialogOpen(false);
      void invalidateIngredients(queryClient, refrigeratorId);
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
      setIsExpireDialogOpen(false);
      void invalidateIngredients(
        queryClient,
        refrigeratorId,
        result.removed ? ingredient.ingredientId : undefined,
      );

      showAppToast({ message: "재고를 처리했어요.", variant: "success" });
      if (!result.removed) {
        submittingRef.current = false;
        setIsPending(false);
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
        setIsExpireDialogOpen(false);
        void invalidateIngredients(queryClient, refrigeratorId);
      }

      if (error instanceof ApiError && error.status === 404) {
        void invalidateIngredients(
          queryClient,
          refrigeratorId,
          ingredient.ingredientId,
        );
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

    setIsExpireDialogOpen(true);
  }

  return (
    <>
      <div className="flex gap-2.5">
        {ingredient.status !== "EXPIRED" ? (
          <AppLink
            href={routes.ingredientEdit(ingredient.ingredientId)}
            className="inline-flex w-28 flex-none items-center justify-center rounded-[4px] border-[1.5px] border-app-ink bg-app-canvas py-[15px] font-app-heading text-[14px] font-bold leading-[1.2] text-app-ink no-underline hover:bg-app-neutral-100 hover:text-app-ink active:bg-app-neutral-200"
          >
            수정
          </AppLink>
        ) : null}
        <button
          type="button"
          onClick={handleExpireClick}
          disabled={isPending}
          aria-busy={isPending}
          className="flex-1 cursor-pointer rounded-[4px] border-0 bg-app-ink py-[15px] font-app-heading text-[14px] font-bold leading-[1.2] text-white hover:bg-app-neutral-800 active:bg-app-neutral-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isPending ? "처리중..." : actionLabel}
        </button>
      </div>

      <AppDialog
        open={isExpireDialogOpen}
        title={`${ingredient.name} ${formatExpireAmount(ingredient)} ${actionLabel}할까요?`}
        description={`보유 수량 전부가 ${actionLabel === "폐기 처리" ? "폐기돼요" : "삭제돼요"}. 정리한 재료는 되돌릴 수 없어요.`}
        dismissBehavior={isPending ? "none" : "secondary-action"}
        secondaryAction={{
          label: "취소",
          disabled: isPending,
          onClick: () => setIsExpireDialogOpen(false),
        }}
        primaryAction={{
          label: isPending ? "처리중..." : `${actionLabel}하기`,
          disabled: isPending,
          onClick: () => void handleExpire(),
        }}
      />
    </>
  );
}
