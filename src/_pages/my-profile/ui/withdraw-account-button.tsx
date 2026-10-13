"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { rotateNotificationSessionScope } from "@/entities/notification";
import { releasePushSubscription } from "@/entities/push-subscription";
import { clearCurrentRefrigeratorId } from "@/entities/refrigerator";
import { refreshCsrfToken } from "@/shared/api";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";
import { showAppToast } from "@/shared/ui/app-toast";

import { withdrawAccount } from "../api/my-profile";

type WithdrawStep = "closed" | "confirm" | "final";

export function WithdrawAccountButton() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<WithdrawStep>("closed");

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      await releasePushSubscription();
      await withdrawAccount();
    },
    onSuccess: () => {
      queryClient.clear();
      clearCurrentRefrigeratorId();
      rotateNotificationSessionScope();
      void refreshCsrfToken();
      window.location.replace(routes.login);
    },
    onError: () => {
      setStep("closed");
      showAppToast({
        message: "탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요",
        variant: "error",
      });
    },
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setStep("confirm")}
        className="mx-auto block min-h-[var(--tap-min)] px-3 text-[13px] text-app-ink/45 underline underline-offset-2 hover:text-app-ink/70"
      >
        회원 탈퇴
      </button>

      <AppDialog
        open={step === "confirm"}
        title="정말 탈퇴할까요?"
        description="냉장고에 담아 둔 재료와 알림 기록이 모두 사라져요."
        secondaryAction={{ label: "취소", onClick: () => setStep("closed") }}
        primaryAction={{ label: "탈퇴", onClick: () => setStep("final") }}
      />

      <AppDialog
        open={step === "final"}
        title="한 번 더 확인할게요"
        description="공유 냉장고에서는 자동으로 빠져요. 방장이라면 먼저 방장을 넘겨 주세요. 되돌릴 수 없어요"
        secondaryAction={{
          label: "취소",
          disabled: withdrawMutation.isPending,
          onClick: () => setStep("closed"),
        }}
        primaryAction={{
          label: "탈퇴하기",
          disabled: withdrawMutation.isPending,
          onClick: () => withdrawMutation.mutate(),
        }}
      />
    </>
  );
}
