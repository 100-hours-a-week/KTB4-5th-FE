"use client";

import {
  formatDaysUntilExpiration,
  formatIngredientAmount,
  type Ingredient,
} from "@/entities/ingredient";
import {
  AppBottomSheetDescription,
  AppBottomSheetTitle,
} from "@/shared/ui/app-bottom-sheet";
import { useState } from "react";

import { CheckMark } from "@/shared/ui/check-mark";
import { FooterButton } from "@/shared/ui/footer-button";

type IngredientDisposeBottomSheetContentProps = {
  ingredients: Ingredient[];
  isComplete: boolean;
  isError: boolean;
  onRetry: () => void;
  onCancel: () => void;
  onConfirm: (ingredientIds: string[]) => void;
};

export function IngredientDisposeBottomSheetContent({
  ingredients,
  isComplete,
  isError,
  onRetry,
  onCancel,
  onConfirm,
}: IngredientDisposeBottomSheetContentProps) {
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => new Set());

  // 공유 냉장고에서 목록이 바뀔 수 있으므로 현재 만료 목록에 남은 선택만 센다.
  const selectedIngredientIds = ingredients
    .map((ingredient) => ingredient.ingredientId)
    .filter((ingredientId) => !excludedIds.has(ingredientId));
  const selectedCount = selectedIngredientIds.length;
  const isAllSelected =
    ingredients.length > 0 && selectedCount === ingredients.length;

  function toggleAll() {
    setExcludedIds(
      isAllSelected
        ? new Set(ingredients.map((ingredient) => ingredient.ingredientId))
        : new Set(),
    );
  }

  function toggleIngredient(ingredientId: string) {
    setExcludedIds((prev) => {
      const next = new Set(prev);

      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }

      return next;
    });
  }

  return (
    <div className="flex max-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-76px)] flex-col">
      <AppBottomSheetTitle className="m-0 font-app-heading text-[16px] font-black leading-[1.35] tracking-normal">
        정리할 재료를 확인해 주세요
      </AppBottomSheetTitle>
      <AppBottomSheetDescription className="m-[4px_0_0] font-app-body text-[12.5px] font-normal leading-[1.35] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)]">
        선택한 재료는 보유 수량 전부가 폐기돼요.
        <br />
        <span className="text-app-text">정리한 재료는 되돌릴 수 없어요.</span>
      </AppBottomSheetDescription>

      <label className="mt-[14px] flex cursor-pointer items-center gap-3 rounded-[10px] bg-app-neutral-100 px-3.5 py-2.5 has-disabled:cursor-default has-disabled:opacity-50">
        <input
          type="checkbox"
          checked={isAllSelected}
          disabled={!isComplete}
          onChange={toggleAll}
          className="peer sr-only"
        />
        <CheckMark />
        <span className="min-w-0 flex-1 font-app-heading text-[13px] font-black leading-[1.35]">
          전체 선택
        </span>
      </label>

      <ul
        aria-label="만료 재료"
        className="relative ml-4 max-h-[45dvh] min-h-0 pr-4 divide-y divide-app-neutral-200 overflow-y-auto overscroll-contain"
      >
        {ingredients.map((ingredient) => (
          <li key={ingredient.ingredientId}>
            <label className="flex cursor-pointer items-center gap-3 py-3">
              <input
                type="checkbox"
                checked={!excludedIds.has(ingredient.ingredientId)}
                onChange={() => toggleIngredient(ingredient.ingredientId)}
                className="peer sr-only"
              />
              <CheckMark />
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="truncate font-app-heading text-[13px] font-black leading-[1.35]">
                  {ingredient.name}
                </span>
                <span className="flex-none font-app-body text-[12px] text-app-neutral-600">
                  {formatIngredientAmount(ingredient)}
                </span>
              </span>
              <span className="flex-none font-app-body text-[12px] text-app-neutral-600">
                {formatDaysUntilExpiration(ingredient.daysUntilExpiration)}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-2">
        <FooterButton size="sm" variant="secondary" onClick={onCancel}>
          취소
        </FooterButton>
        {isError ? (
          <FooterButton size="sm" onClick={onRetry}>
            다시 불러오기
          </FooterButton>
        ) : (
          <FooterButton
            size="sm"
            disabled={!isComplete || selectedCount === 0}
            onClick={() => onConfirm(selectedIngredientIds)}
          >
            {isComplete ? `${selectedCount}종 폐기하기` : "불러오는 중..."}
          </FooterButton>
        )}
      </div>
    </div>
  );
}
