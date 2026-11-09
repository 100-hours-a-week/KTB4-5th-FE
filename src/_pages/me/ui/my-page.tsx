"use client";

import { useQuery } from "@tanstack/react-query";

import {
  refrigeratorQueries,
  useCurrentRefrigeratorId,
} from "@/entities/refrigerator";
import { ApiError } from "@/shared/api";
import { userQueries } from "@/entities/user";
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
  const me = useQuery(userQueries.me());
  const refrigeratorId = useCurrentRefrigeratorId();
  const { data, error, isError, isFetching, refetch } = useQuery({
    ...refrigeratorQueries.mypage(refrigeratorId ?? ""),
    enabled: Boolean(refrigeratorId),
  });

  const isRetrying = isFetching || me.isFetching;
  const profileError = error ?? me.error;

  if (isError || me.isError) {
    return (
      <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
        <AsyncViewState
          status="error"
          title={
            profileError instanceof ApiError
              ? "프로필을 불러오지 못했어요"
              : "네트워크 연결을 확인해 주세요"
          }
          description="잠시 후 다시 시도해 주세요"
          action={
            <button
              type="button"
              disabled={isRetrying}
              onClick={() => void Promise.all([refetch(), me.refetch()])}
              className={asyncViewActionClassName}
            >
              {isRetrying ? "로딩 중" : "다시 시도"}
            </button>
          }
        />
      </main>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-6">
      <div className="flex flex-col gap-4">
        <MyProfileCard overview={data} />
        <MyStockSummary overview={data} cookingCount={me.data?.cookingCount} />
        <p className="m-0 break-keep text-[12px] leading-[1.5] text-app-ink/55">
          만든 요리 수는 요리 상세에서 요리 기록을 저장한 횟수예요. 차감할 재료
          없이 기록만 저장한 경우도 포함하며, 조회만 한 요리는 세지 않아요.
        </p>
        <div className="flex flex-col divide-y divide-app-neutral-200 overflow-hidden rounded-[4px] bg-white shadow-app-sm">
          <div>
            <ShareSettingsCard memberNum={data?.memberNum} />
          </div>
          <div>
            <PushNotificationSettingsCard
              preferences={data?.notificationPreferences}
            />
          </div>
          <div>
            <LogoutSettingsCard />
          </div>
        </div>
      </div>
    </div>
  );
}
