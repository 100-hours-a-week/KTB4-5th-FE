"use client";

import type { ReactNode } from "react";

import { useCurrentRefrigeratorRecovery } from "@/entities/refrigerator";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

type CurrentRefrigeratorGateProps = {
  children: ReactNode;
};

export function CurrentRefrigeratorGate({
  children,
}: CurrentRefrigeratorGateProps) {
  const { isRecoveryError, retryRecovery } = useCurrentRefrigeratorRecovery();

  if (!isRecoveryError) {
    return children;
  }

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
      <AsyncViewState
        status="error"
        title="냉장고 정보를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요"
        action={
          <button
            type="button"
            onClick={retryRecovery}
            className={asyncViewActionClassName}
          >
            다시 시도
          </button>
        }
      />
    </main>
  );
}
