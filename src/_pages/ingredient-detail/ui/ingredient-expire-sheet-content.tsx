"use client";

import { useState } from "react";

import { INGREDIENT_QUANTITY_UNIT } from "@/entities/ingredient";
import {
  AppBottomSheetDescription,
  AppBottomSheetTitle,
} from "@/shared/ui/app-bottom-sheet";
import { FooterButton } from "@/shared/ui/footer-button";
import { NumberKeypad } from "@/shared/ui/number-keypad";

import {
  appendExpireDigit,
  formatExpireAmountHelper,
} from "../lib/format-expire-amount";
import { getExpireAmountField } from "../model/expire-amount";
import type { MockIngredientDetail } from "../model/mock-ingredient-detail";

type IngredientExpireSheetContentProps = {
  ingredient: MockIngredientDetail;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (amount: number) => void;
};

export function IngredientExpireSheetContent({
  ingredient,
  isPending,
  onCancel,
  onConfirm,
}: IngredientExpireSheetContentProps) {
  const [value, setValue] = useState("");
  const field = getExpireAmountField(ingredient, value);

  function handleSubmit() {
    if (!isPending && field.amount !== null && field.canSubmit) {
      onConfirm(field.amount);
    }
  }

  return (
    <>
      <AppBottomSheetTitle className="m-0 font-app-heading text-[19px] font-black leading-[1.35] tracking-normal">
        {ingredient.name} 몇 개 비울까요?
      </AppBottomSheetTitle>

      <p className="m-[14px_0_0] flex items-center gap-3 rounded-[10px] bg-app-neutral-100 px-4 py-[15px]">
        <span className="min-w-0 flex-1 font-app-body text-[14px] leading-none text-app-ink/55">
          현재 수량
        </span>
        <span className="flex-none font-app-heading text-[16px] font-black leading-none">
          {field.stock}
          {INGREDIENT_QUANTITY_UNIT}
        </span>
      </p>

      <p className="m-[10px_0_0] flex items-baseline gap-3 rounded-[10px] border-2 border-app-ink px-4 py-[13px]">
        <span className="min-w-0 flex-1 font-app-body text-[14px] leading-none text-app-ink/55">
          비울 수량
        </span>
        <span
          aria-live="polite"
          aria-atomic="true"
          className={`flex-none font-app-mono text-[24px] font-black leading-none ${
            value === "" ? "text-app-ink/30" : "text-app-ink"
          }`}
        >
          {value === "" ? "0" : value}
        </span>
        <span className="flex-none font-app-body text-[14px] leading-none text-app-ink/55">
          {INGREDIENT_QUANTITY_UNIT}
        </span>
      </p>

      <AppBottomSheetDescription
        className={`m-[8px_0_0] font-app-body text-[13px] leading-[1.35] ${
          field.hasError ? "text-app-primary" : "text-app-ink/50"
        }`}
      >
        {formatExpireAmountHelper(field)}
      </AppBottomSheetDescription>

      <div className="mt-[14px] flex gap-2.5">
        {field.quickOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={field.amount === option.amount}
            disabled={isPending || option.disabled}
            onClick={() => setValue(String(option.amount))}
            className={`min-h-[var(--tap-min)] max-w-[33%] flex-1 cursor-pointer rounded-[22px] border-0 font-app-body text-[14px] leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              field.amount === option.amount
                ? "bg-app-ink font-bold text-white"
                : "bg-app-neutral-100 text-app-ink/60"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-[14px]">
        <NumberKeypad
          disabled={isPending}
          backspaceDisabled={value === ""}
          onDigit={(digit) =>
            setValue((prev) => appendExpireDigit(prev, digit, field.stock))
          }
          onBackspace={() => setValue((prev) => prev.slice(0, -1))}
        />
      </div>

      <div className="mt-[18px] flex gap-[10px]">
        <FooterButton
          variant="secondary"
          onClick={onCancel}
          disabled={isPending}
        >
          취소
        </FooterButton>
        <FooterButton
          disabled={isPending || !field.canSubmit}
          onClick={handleSubmit}
          aria-busy={isPending}
        >
          {isPending ? "처리중..." : "만료 처리"}
        </FooterButton>
      </div>
    </>
  );
}
