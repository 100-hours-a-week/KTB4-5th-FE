"use client";

import {
  AppBottomSheet,
  AppBottomSheetDescription,
  AppBottomSheetTitle,
} from "@/shared/ui/app-bottom-sheet";
import { AppDialog } from "@/shared/ui/app-dialog";
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
  const failure =
    status === "error" ? (
      <p
        role="alert"
        className="mt-2 mb-0 rounded-[4px] bg-[var(--color-accent-100)] px-4 py-3 text-[12.5px] font-bold leading-[1.45] text-app-primary"
      >
        {errorMessage ??
          "처리 결과를 확인하지 못했어요. 같은 요청으로 다시 확인해 주세요."}
      </p>
    ) : null;

  if (rows.length === 0) {
    return (
      <AppDialog
        open={open}
        title={`${recipeName} 요리 기록을 저장할까요?`}
        description="차감할 재료가 없어 요리 기록만 저장돼요. 저장 후 되돌릴 수 없습니다."
        dismissBehavior={isPending ? "none" : "secondary-action"}
        secondaryAction={{
          label: "취소",
          onClick: onDismiss,
          disabled: isPending,
        }}
        primaryAction={{
          label: isPending
            ? "저장 중…"
            : status === "error"
              ? "다시 시도"
              : "기록 저장",
          onClick: onConfirm,
          disabled: isPending,
        }}
      >
        {failure}
      </AppDialog>
    );
  }

  return (
    <AppBottomSheet
      open={open}
      onDismiss={onDismiss}
      dismissBehavior={isPending ? "none" : "dismiss"}
    >
      <AppBottomSheetTitle className="m-0 font-app-heading text-[18px] font-black leading-tight">
        이 재료를 차감할까요?
      </AppBottomSheetTitle>
      <AppBottomSheetDescription className="mt-1.5 mb-0 break-keep text-[12.5px] leading-[1.45] text-app-ink/60">
        {`'${recipeName}'의 차감 수량이에요. 재고가 바뀌면 다시 확인해야 해요. 적용 후 되돌릴 수 없습니다.`}
      </AppBottomSheetDescription>

      <ul className="mt-2 flex flex-col">
        {rows.map((row) => (
          <li
            key={row.ingredientId}
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
                {`${row.before} › ${row.after}${row.unitLabel}`}
              </Badge>
            </span>
          </li>
        ))}
      </ul>

      {hasRemovedRow ? (
        <p className="mt-2 mb-0 rounded-[4px] bg-app-neutral-100 px-4 py-3 text-[12.5px] leading-[1.45] text-app-ink/60">
          수량이 0이 되는 재고는 삭제돼요.
        </p>
      ) : null}

      {failure}

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
              : "차감하기"}
        </FooterButton>
      </div>
    </AppBottomSheet>
  );
}
