"use client";

import { useState } from "react";

import type { Ingredient } from "@/entities/ingredient";
import { showAppToast } from "@/shared/ui/app-toast";

import { IngredientDisposeBottomSheet } from "./ingredient-dispose-sheet";

type IngredientDisposeBannerProps = {
  refrigeratorId: string;
  expiredCount: number;
  expiredIngredients: Ingredient[];
  onLoadAll: () => Promise<boolean>;
};

export function IngredientDisposeBanner({
  refrigeratorId,
  expiredCount,
  expiredIngredients,
  onLoadAll,
}: IngredientDisposeBannerProps) {
  const [isDisposeSheetOpen, setIsDisposeSheetOpen] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  async function openDisposeSheet() {
    setIsLoadingAll(true);
    const loaded = await onLoadAll();
    setIsLoadingAll(false);

    if (!loaded) {
      showAppToast({
        message: "만료 재료를 불러오지 못했어요. 다시 시도해 주세요.",
        variant: "error",
      });
      return;
    }
    setIsDisposeSheetOpen(true);
  }

  function closeDisposeSheet() {
    setIsDisposeSheetOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openDisposeSheet()}
        disabled={isLoadingAll}
        aria-busy={isLoadingAll}
        className="relative block w-full cursor-pointer bg-transparent p-0 pt-[11px] text-left"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 z-[1] h-5 w-[58px] -translate-x-1/2 -rotate-3 bg-[color-mix(in_srgb,var(--color-highlight)_80%,transparent)]"
        />
        <span className="relative flex items-center gap-3 rounded-[4px] bg-white px-4 py-3.5 shadow-[0_4px_16px_color-mix(in_srgb,var(--color-ink)_16%,transparent)]">
          <span className="min-w-0 flex-1">
            <span className="block font-app-heading text-[16px] font-black leading-[1.35] text-app-text">
              만료 {expiredCount}종, 한 번에 정리하기
            </span>
          </span>
          <span
            aria-hidden="true"
            className="flex-none font-app-heading text-[15px] font-black text-app-ink/40"
          >
            ›
          </span>
        </span>
      </button>

      <IngredientDisposeBottomSheet
        open={isDisposeSheetOpen}
        refrigeratorId={refrigeratorId}
        ingredients={expiredIngredients}
        onClose={closeDisposeSheet}
      />
    </>
  );
}
