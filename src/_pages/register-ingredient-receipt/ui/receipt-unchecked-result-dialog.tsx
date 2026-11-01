"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ImageAnalysisListItem } from "@/entities/image";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";

const DAY_MS = 86_400_000;

type ReceiptUncheckedResultDialogProps = {
  analysis: ImageAnalysisListItem;
  isDiscarding: boolean;
  onDiscard: () => void;
};

function getDeletionLabel(expiresAt: string | null) {
  if (!expiresAt) return null;
  const days = Math.floor((Date.parse(expiresAt) - Date.now()) / DAY_MS);
  return days > 0 ? `${days}일 후 삭제돼요` : "오늘 삭제돼요";
}

export function ReceiptUncheckedResultDialog({
  analysis,
  isDiscarding,
  onDiscard,
}: ReceiptUncheckedResultDialogProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const itemCount = analysis.images.reduce(
    (sum, result) => sum + (result.itemCount ?? 0),
    0,
  );
  const summary = [
    `사진 ${analysis.totalImageCount}장 · 품목 ${itemCount}개`,
    getDeletionLabel(analysis.expiresAt),
  ]
    .filter(Boolean)
    .join("\n");

  function openResult() {
    const href = routes.imageAnalysisResult(analysis.analysisId);
    markAppNavigationIntent("push", href);
    router.push(href);
  }

  if (isConfirming) {
    return (
      <AppDialog
        open
        dismissBehavior="none"
        title="정말 다시 찍을까요?"
        description={"이전 인식 결과는 삭제되고 되돌릴 수 없어요."}
        secondaryAction={{
          label: "취소",
          onClick: () => setIsConfirming(false),
          disabled: isDiscarding,
        }}
        primaryAction={{
          label: "다시 찍기",
          onClick: onDiscard,
          disabled: isDiscarding,
        }}
      />
    );
  }

  return (
    <AppDialog
      open
      dismissBehavior="none"
      title="확인하지 않은 인식 결과가 있어요"
      description={`${summary}\n\n처음부터 시작하면 이전 결과는 삭제돼요.`}
      secondaryAction={{
        label: "처음부터 시작하기",
        onClick: () => setIsConfirming(true),
      }}
      primaryAction={{ label: "인식 결과 보기", onClick: openResult }}
    />
  );
}
