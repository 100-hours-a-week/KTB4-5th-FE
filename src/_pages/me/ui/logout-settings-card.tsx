"use client";

import { useState } from "react";

import { useLogout } from "@/features/logout";
import { AppDialog } from "@/shared/ui/app-dialog";

import { SettingsCard } from "./settings-card";

// SERVICE_COMMON_RULES §7.2: 확인형 모달 6종에 로그아웃이 포함된다.
// "OO할까요?" 제목 + 보조 문구 + [취소] [실행] 순서.
export function LogoutSettingsCard() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const logoutMutation = useLogout();

  return (
    <>
      <SettingsCard
        title="로그아웃"
        disabled={logoutMutation.isPending}
        onClick={() => setIsConfirmOpen(true)}
      />

      <AppDialog
        open={isConfirmOpen}
        title="로그아웃할까요?"
        description="다시 이용하려면 아이디와 비밀번호로 로그인해야 해요."
        secondaryAction={{
          label: "취소",
          disabled: logoutMutation.isPending,
          onClick: () => setIsConfirmOpen(false),
        }}
        primaryAction={{
          label: "로그아웃",
          disabled: logoutMutation.isPending,
          onClick: () => {
            // 실패 토스트는 모달이 닫힌 뒤 보여야 가려지지 않는다.
            logoutMutation.mutate(undefined, {
              onError: () => setIsConfirmOpen(false),
            });
          },
        }}
      />
    </>
  );
}
