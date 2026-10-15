"use client";

import { useState } from "react";

import { useLogout } from "@/features/logout";
import { AppDialog } from "@/shared/ui/app-dialog";

import { SettingsCard } from "./settings-card";

export function LogoutSettingsCard() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const logoutMutation = useLogout();

  return (
    <>
      <SettingsCard
        title="로그아웃"
        disabled={isLeaving}
        onClick={() => setIsConfirmOpen(true)}
      />

      <AppDialog
        open={isConfirmOpen}
        title="로그아웃할까요?"
        description="다시 로그인하면 냉장고 정보는 그대로예요."
        secondaryAction={{
          label: "취소",
          disabled: isLeaving,
          onClick: () => setIsConfirmOpen(false),
        }}
        primaryAction={{
          label: isLeaving ? "로그아웃 중..." : "로그아웃",
          disabled: isLeaving,
          onClick: () => {
            setIsLeaving(true);
            logoutMutation.mutate(undefined, {
              onError: () => {
                setIsLeaving(false);
                setIsConfirmOpen(false);
              },
            });
          },
        }}
      />
    </>
  );
}
