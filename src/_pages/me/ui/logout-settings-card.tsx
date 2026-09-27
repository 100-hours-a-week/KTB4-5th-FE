"use client";

import { useState } from "react";

import { useLogout } from "@/features/logout";
import { AppDialog } from "@/shared/ui/app-dialog";

import { SettingsCard } from "./settings-card";

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
            logoutMutation.mutate(undefined, {
              onError: () => setIsConfirmOpen(false),
            });
          },
        }}
      />
    </>
  );
}
