"use client";

import { useRouter } from "next/navigation";

import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";

import type { ReceiptAnalysisFailure } from "../model/use-receipt-analysis";

type ReceiptAnalysisFailureDialogProps = {
  failure: ReceiptAnalysisFailure;
  failureMessage?: string;
  onRetake: () => void;
};

export function ReceiptAnalysisFailureDialog({
  failure,
  failureMessage,
  onRetake,
}: ReceiptAnalysisFailureDialogProps) {
  const router = useRouter();

  return (
    <AppDialog
      open={failure === "FAILED"}
      dismissBehavior="none"
      title="영수증을 읽지 못했어요"
      description={
        failureMessage ??
        "밝은 곳에서 영수증 전체가 보이게 다시 찍거나, 직접 입력해 주세요."
      }
      secondaryAction={{
        label: "직접 입력",
        onClick: () => {
          onRetake();
          router.replace(routes.registerIngredientManual);
        },
      }}
      primaryAction={{ label: "다시 촬영", onClick: onRetake }}
    />
  );
}
