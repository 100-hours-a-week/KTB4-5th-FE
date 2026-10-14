"use client";

import { useQuery } from "@tanstack/react-query";

import { userQueries } from "@/entities/user";
import { ApiError } from "@/shared/api";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

import { LogoutSettingsCard } from "./logout-settings-card";
import { MyProfileCard } from "./my-profile-card";
import { MyStockSummary } from "./my-stock-summary";
import { PushNotificationSettingsCard } from "./push-notification-settings-card";
import { ShareSettingsCard } from "./share-settings-card";

export function MyPage() {
  const { error, isError, isFetching, refetch } = useQuery(userQueries.me());

  if (isError) {
    return (
      <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
        <AsyncViewState
          status="error"
          title={
            error instanceof ApiError
              ? "프로필을 불러오지 못했어요"
              : "네트워크 연결을 확인해 주세요"
          }
          description="잠시 후 다시 시도해 주세요"
          action={
            <button
              type="button"
              disabled={isFetching}
              onClick={() => void refetch()}
              className={asyncViewActionClassName}
            >
              {isFetching ? "로딩 중" : "다시 시도"}
            </button>
          }
        />
      </main>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-6">
      <div className="flex flex-col gap-4">
        <MyProfileCard />
        <MyStockSummary />
        <div className="flex flex-col divide-y divide-app-neutral-200 overflow-hidden rounded-[4px] bg-white shadow-app-sm">
          <div>
            <ShareSettingsCard />
          </div>
          <div>
            <PushNotificationSettingsCard />
          </div>
          <div>
            <LogoutSettingsCard />
          </div>
        </div>
      </div>
    </div>
  );
}
