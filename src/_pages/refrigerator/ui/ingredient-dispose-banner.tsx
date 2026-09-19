"use client";

import { useState } from "react";

import { AppDialog } from "@/shared/ui/app-dialog";

type IngredientDisposeBannerProps = {
  expiredCount: number;
};

export function IngredientDisposeBanner({
  expiredCount,
}: IngredientDisposeBannerProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  function closeConfirm() {
    setIsConfirmOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        className="relative block w-full cursor-pointer bg-transparent p-0 pt-[11px] text-left"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 z-[1] h-5 w-[58px] -translate-x-1/2 -rotate-3 bg-[color-mix(in_srgb,var(--color-highlight)_80%,transparent)]"
        />
        <span className="relative flex items-center gap-3 rounded-[4px] bg-white p-5 shadow-[0_4px_16px_color-mix(in_srgb,var(--color-ink)_16%,transparent)]">
          <span className="min-w-0 flex-1">
            <span className="block font-app-heading text-[19px] font-black leading-[1.35] text-app-text">
              만료 {expiredCount}종, 한 번에 정리하기
            </span>
          </span>
          <span
            aria-hidden="true"
            className="flex-none font-app-heading text-[17px] font-black text-app-ink/40"
          >
            ›
          </span>
        </span>
      </button>

      <AppDialog
        open={isConfirmOpen}
        title={`만료 재료 ${expiredCount}종을 정리할까요?`}
        description={`재료들을 냉장고에서 빼요.\n정리한 재료는 되돌릴 수 없어요.`}
        secondaryAction={{ label: "취소", onClick: closeConfirm }}
        primaryAction={{
          label: "정리하기",
          // TODO(API 연동): DELETE /refrigerators/{id}/ingredients/expired 호출 후 목록 무효화
          onClick: closeConfirm,
        }}
      />
    </>
  );
}
