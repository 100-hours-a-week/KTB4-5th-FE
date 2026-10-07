"use client";

import { useRouter } from "next/navigation";

import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";

import type { ReceiptAnalysisFailure } from "../model/use-receipt-analysis";
import { useReceiptResultStore } from "../model/use-receipt-result-store";

type ReceiptAnalysisFailureDialogProps = {
  failure: ReceiptAnalysisFailure;
  onRetake: () => void;
  onContinue: () => void;
};

export function ReceiptAnalysisFailureDialog({
  failure,
  onRetake,
  onContinue,
}: ReceiptAnalysisFailureDialogProps) {
  const router = useRouter();
  const result = useReceiptResultStore((state) => state.result);

  if (failure === "FAILED") {
    return (
      <AppDialog
        open
        dismissBehavior="none"
        title="영수증을 읽지 못했어요"
        description="밝은 곳에서 영수증 전체가 보이게 다시 찍거나, 직접 입력해 주세요."
        secondaryAction={{
          label: "직접 입력",
          onClick: () => router.replace(routes.registerIngredientManual),
        }}
        primaryAction={{ label: "다시 촬영", onClick: onRetake }}
      />
    );
  }

  return (
    <AppDialog
      open={failure === "PARTIAL"}
      title="일부 품목을 읽지 못했어요"
      description={`${result?.drafts.length ?? 0}개는 읽었고 사진 ${result?.unreadCount ?? 0}장은 읽지 못했어요. 읽은 품목만으로 계속할 수 있어요.`}
      secondaryAction={{ label: "다시 촬영", onClick: onRetake }}
      primaryAction={{ label: "계속 진행", onClick: onContinue }}
    />
  );
}
