"use client";

import {
  AppBottomSheet,
  AppBottomSheetDescription,
  AppBottomSheetTitle,
} from "@/shared/ui/app-bottom-sheet";
import { Badge } from "@/shared/ui/badge";
import { FooterButton } from "@/shared/ui/footer-button";

import type { RecipeConsumeRow } from "../model/recipe-ingredients";

export type RecipeConsumeStatus = "idle" | "pending" | "error";

type RecipeConsumeSheetProps = {
  open: boolean;
  status: RecipeConsumeStatus;
  recipeName: string;
  rows: RecipeConsumeRow[];
  onConfirm: () => void;
  onDismiss: () => void;
  errorMessage?: string;
};

export function RecipeConsumeSheet({
  errorMessage,
  onConfirm,
  onDismiss,
  open,
  recipeName,
  rows,
  status,
}: RecipeConsumeSheetProps) {
  const isPending = status === "pending";
  const hasRemovedRow = rows.some((row) => row.after === 0);

  return (
    <AppBottomSheet
      open={open}
      onDismiss={onDismiss}
      dismissBehavior={isPending ? "none" : "dismiss"}
    >
      <AppBottomSheetTitle className="m-0 font-app-heading text-[18px] font-black leading-tight">
        {rows.length > 0 ? "이 재료를 차감할까요?" : "이 요리를 적용할까요?"}
      </AppBottomSheetTitle>
      <AppBottomSheetDescription className="mt-1.5 mb-0 break-keep text-[12.5px] leading-[1.45] text-app-ink/60">
        {rows.length > 0
          ? `'${recipeName}'의 예상 차감 수량이에요. 현재 재고에 따라 실제 차감 수량이 달라질 수 있어요. 적용 후 되돌릴 수 없습니다.`
          : "차감할 재료가 없어 요리 기록만 저장돼요. 적용 후 되돌릴 수 없습니다."}
      </AppBottomSheetDescription>

      <ul className="mt-2 flex flex-col">
        {rows.map((row) => (
          <li
            key={row.recipeIngredientId}
            className="grid grid-cols-2 items-center gap-2.5 border-app-neutral-200 py-3 [&+&]:border-t"
          >
            <span className="min-w-0 wrap-anywhere text-[15px] font-bold text-app-ink">
              {row.name}
            </span>
            <span className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
              <span className="max-w-full wrap-anywhere text-right text-[14px] text-app-ink/55">
                {row.amountText}
              </span>
              <Badge
                tone="muted"
                className="max-w-full wrap-anywhere whitespace-normal!"
              >
                {row.partial
                  ? "보유량에서 차감"
                  : `${row.before} › ${row.after}${row.unitLabel}`}
              </Badge>
            </span>
          </li>
        ))}
      </ul>

      {hasRemovedRow ? (
        <p className="mt-2 mb-0 rounded-[4px] bg-app-neutral-100 px-4 py-3 text-[12.5px] leading-[1.45] text-app-ink/60">
          실제 차감 수량과 소진 재고 처리는 적용 시 현재 재고를 기준으로
          확정돼요.
        </p>
      ) : null}

      {status === "error" ? (
        <p
          role="alert"
          className="mt-2 mb-0 rounded-[4px] bg-[var(--color-accent-100)] px-4 py-3 text-[12.5px] font-bold leading-[1.45] text-app-primary"
        >
          {errorMessage ??
            "처리 결과를 확인하지 못했어요. 같은 요청으로 다시 확인해 주세요."}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <FooterButton
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={onDismiss}
        >
          취소
        </FooterButton>
        <FooterButton
          size="sm"
          disabled={isPending}
          aria-busy={isPending || undefined}
          onClick={onConfirm}
        >
          {isPending
            ? "차감 중…"
            : status === "error"
              ? "다시 시도"
              : rows.length > 0
                ? "차감하기"
                : "적용하기"}
        </FooterButton>
      </div>
    </AppBottomSheet>
  );
}
