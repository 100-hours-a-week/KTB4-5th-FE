"use client";

import { useState } from "react";

import { useWithdrawAccount } from "@/features/withdraw-account";
import { AppDialog } from "@/shared/ui/app-dialog";

type Step = "closed" | "confirm" | "final";

export function WithdrawAccountButton() {
  const [step, setStep] = useState<Step>("closed");
  const [isLeaving, setIsLeaving] = useState(false);
  const withdrawMutation = useWithdrawAccount();
  const close = () => setStep("closed");

  return (
    <>
      <button
        type="button"
        disabled={isLeaving}
        onClick={() => setStep("confirm")}
        className="self-center bg-transparent px-2 py-2 text-[13px] text-app-ink/45 underline underline-offset-2 hover:text-app-ink/70 disabled:opacity-50"
      >
        회원 탈퇴
      </button>

      <AppDialog
        open={step === "confirm"}
        title="회원 탈퇴할까요?"
        description="탈퇴하면 되돌릴 수 없어요."
        secondaryAction={{ label: "취소", onClick: close }}
        primaryAction={{ label: "다음", onClick: () => setStep("final") }}
      />

      <AppDialog
        open={step === "final"}
        title="정말 탈퇴할까요?"
        description="계정과 개인 재고 정보가 삭제되며 되돌릴 수 없어요. 공유 중인 냉장고에서는 자동으로 나가요."
        secondaryAction={{
          label: "취소",
          disabled: isLeaving,
          onClick: close,
        }}
        primaryAction={{
          label: isLeaving ? "탈퇴 중..." : "탈퇴",
          disabled: isLeaving,
          onClick: () => {
            setIsLeaving(true);
            withdrawMutation.mutate(undefined, {
              onError: () => {
                setIsLeaving(false);
                close();
              },
            });
          },
        }}
      />
    </>
  );
}
