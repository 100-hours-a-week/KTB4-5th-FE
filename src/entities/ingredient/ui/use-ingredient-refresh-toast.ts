"use client";

import { useEffect } from "react";

import { showPersistentAppToast } from "@/shared/ui/app-toast";

const reloadPage = () => window.location.reload();

export function useIngredientRefreshToast(
  isDateStale: boolean,
  onRefresh: () => void = reloadPage,
) {
  useEffect(() => {
    if (!isDateStale) return;
    return showPersistentAppToast({
      message: "조회 기준일이 지났어요. 새로고침해 주세요",
      variant: "success",
      action: { label: "새로고침", onClick: onRefresh },
    });
  }, [isDateStale, onRefresh]);
}
