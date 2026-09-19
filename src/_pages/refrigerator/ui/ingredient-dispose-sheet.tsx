"use client";

import { useState } from "react";

import {
  formatDaysUntilExpiration,
  formatIngredientAmount,
  type Ingredient,
} from "@/entities/ingredient";
import {
  AppBottomSheet,
  AppBottomSheetDescription,
  AppBottomSheetTitle,
} from "@/shared/ui/app-bottom-sheet";
import { FooterButton } from "@/shared/ui/footer-button";
import { CheckMark } from "@/shared/ui/check-mark";

type IngredientDisposeSheetProps = {
  open: boolean;
  refrigeratorId: string;
  ingredients: Ingredient[];
  onClose: () => void;
};

type IngredientDisposeSheetContentProps = {
  ingredients: Ingredient[];
  onCancel: () => void;
};

export function IngredientDisposeSheet({
  open,
  ingredients,
  onClose,
}: IngredientDisposeSheetProps) {
  return (
    <AppBottomSheet open={open} onDismiss={onClose}>
      {/* 닫히면 내용이 unmount되므로 열 때마다 선택값이 전체 선택으로 초기화된다. */}
      <IngredientDisposeSheetContent
        ingredients={ingredients}
        onCancel={onClose}
      />
    </AppBottomSheet>
  );
}

function IngredientDisposeSheetContent({
  ingredients,
  onCancel,
}: IngredientDisposeSheetContentProps) {
  const [checkedIds, setCheckedIds] = useState(
    () => new Set(ingredients.map((ingredient) => ingredient.ingredientId)),
  );

  // 공유 냉장고에서 목록이 바뀔 수 있으므로 현재 만료 목록에 남은 선택만 센다.
  const selectedIngredientIds = ingredients
    .map((ingredient) => ingredient.ingredientId)
    .filter((ingredientId) => checkedIds.has(ingredientId));
  const selectedCount = selectedIngredientIds.length;
  const isAllSelected =
    ingredients.length > 0 && selectedCount === ingredients.length;

  function toggleAll() {
    setCheckedIds(
      isAllSelected
        ? new Set()
        : new Set(ingredients.map((ingredient) => ingredient.ingredientId)),
    );
  }

  function toggleIngredient(ingredientId: string) {
    setCheckedIds((prev) => {
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
    <>
      <AppBottomSheetTitle className="m-0 font-app-heading text-[19px] font-black leading-[1.35] tracking-normal">
        정리할 재료를 확인해 주세요
      </AppBottomSheetTitle>
      <AppBottomSheetDescription className="m-[5px_0_0] font-app-body text-[13px] font-normal leading-[1.35] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)]">
        선택한 재료는 보유 수량 전부가 폐기돼요.
        <br />
        <span className="text-app-text">정리한 재료는 되돌릴 수 없어요.</span>
      </AppBottomSheetDescription>

      <label className="mt-[18px] flex cursor-pointer items-center gap-4 rounded-[10px] bg-app-neutral-100 px-4 py-[13px]">
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={toggleAll}
          className="peer sr-only"
        />
        <CheckMark />
        <span className="min-w-0 flex-1 font-app-heading text-[15px] font-black leading-[1.35]">
          전체 선택
        </span>
        <span className="flex-none font-app-body text-[13px] text-app-neutral-600">
          {selectedCount}종 선택됨
        </span>
      </label>

      <ul
        aria-label="만료 재료"
        className="mx-4 divide-y divide-app-neutral-200"
      >
        {ingredients.map((ingredient) => (
          <li key={ingredient.ingredientId}>
            <label className="flex cursor-pointer items-center gap-4 py-[18px]">
              <input
                type="checkbox"
                checked={checkedIds.has(ingredient.ingredientId)}
                onChange={() => toggleIngredient(ingredient.ingredientId)}
                className="peer sr-only"
              />
              <CheckMark />
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="truncate font-app-heading text-[15px] font-black leading-[1.35]">
                  {ingredient.name}
                </span>
                <span className="flex-none font-app-body text-[13px] text-app-neutral-600">
                  {formatIngredientAmount(ingredient)}
                </span>
              </span>
              <span className="flex-none font-app-body text-[13px] text-app-neutral-600">
                {formatDaysUntilExpiration(ingredient.daysUntilExpiration)}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-[18px] flex gap-[10px]">
        <FooterButton variant="secondary" onClick={onCancel}>
          취소
        </FooterButton>
        {/* TODO: 만료 처리 API 연동 필요 */}
        <FooterButton>{selectedCount}종 폐기하기</FooterButton>
      </div>
    </>
  );
}
