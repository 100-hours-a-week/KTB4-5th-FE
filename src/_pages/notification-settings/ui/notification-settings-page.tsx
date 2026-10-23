"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  isExpirationNotificationEnabled,
  notificationQueries,
  useNotificationSessionScope,
  type NotificationPreferencesResponse,
} from "@/entities/notification";
import {
  refrigeratorQueries,
  type MypageOverview,
} from "@/entities/refrigerator";
import {
  updateNotificationPreference,
  usePushNotificationSetting,
  PushInstallGuideSheet,
  PushPermissionGuideSheet,
} from "@/features/manage-push-notifications";
import { SessionExpiredError } from "@/shared/api";
import { showAppToast } from "@/shared/ui/app-toast";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

type SettingSwitchProps = {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
};

function SettingSwitch({
  title,
  description,
  checked,
  disabled,
  onChange,
}: SettingSwitchProps) {
  return (
    <label className="flex min-h-[112px] items-center justify-between gap-4 rounded-[24px] bg-app-neutral-100 px-5 py-5 has-disabled:opacity-55">
      <span className="min-w-0">
        <span className="block font-app-heading text-[18px] font-black text-app-ink">
          {title}
        </span>
        <span className="mt-2 block text-[13px] leading-5 text-app-ink/55">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-8 w-[52px] shrink-0 rounded-full bg-app-neutral-300 transition-colors peer-checked:bg-app-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-app-ink after:absolute after:top-1 after:left-1 after:size-6 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}

export function NotificationSettingsPage() {
  const queryClient = useQueryClient();
  const push = usePushNotificationSetting();
  const sessionScope = useNotificationSessionScope();
  const queryOptions = notificationQueries.preferences(sessionScope ?? "");
  const preferencesQuery = useQuery({
    ...queryOptions,
    enabled: sessionScope !== undefined,
  });
  const preferenceMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      updateNotificationPreference("EXPIRATION", enabled),
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: queryOptions.queryKey });
      const previous =
        queryClient.getQueryData<NotificationPreferencesResponse>(
          queryOptions.queryKey,
        );
      queryClient.setQueryData<NotificationPreferencesResponse>(
        queryOptions.queryKey,
        (current) =>
          current && {
            notificationPreferences: [
              ...current.notificationPreferences.filter(
                (item) => item.type !== "EXPIRATION",
              ),
              { type: "EXPIRATION", isEnabled: enabled },
            ],
          },
      );
      return previous;
    },
    onSuccess: async (saved) => {
      const mypageFilter = {
        queryKey: refrigeratorQueries.all(),
        predicate: (query: { queryKey: readonly unknown[] }) =>
          query.queryKey[2] === "mypage",
      };
      await queryClient.cancelQueries(mypageFilter);
      queryClient.setQueryData(queryOptions.queryKey, saved);
      queryClient.setQueriesData<MypageOverview>(
        mypageFilter,
        (current) =>
          current && {
            ...current,
            notificationPreferences: saved.notificationPreferences,
          },
      );
    },
    onError: (error, _enabled, previous) => {
      if (previous) queryClient.setQueryData(queryOptions.queryKey, previous);
      if (error instanceof SessionExpiredError) return;
      showAppToast({
        message: "설정을 저장하지 못했어요",
        variant: "error",
        dedupeKey: "notification-preference-save-error",
      });
    },
  });

  if (!preferencesQuery.data) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {preferencesQuery.isError ? (
          <AsyncViewState
            status="error"
            title="알림 설정을 불러오지 못했어요"
            action={
              <button
                type="button"
                onClick={() => void preferencesQuery.refetch()}
                className={asyncViewActionClassName}
              >
                다시 시도
              </button>
            }
          />
        ) : (
          <AsyncViewState
            status="loading"
            title="알림 설정을 불러오는 중입니다"
          />
        )}
      </main>
    );
  }

  const expirationEnabled = isExpirationNotificationEnabled(
    preferencesQuery.data.notificationPreferences,
  );

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-8">
      <p className="mb-4 text-[13px] text-app-ink/55">
        변경한 내용은 바로 저장돼요
      </p>

      <div className="flex flex-col gap-4">
        <SettingSwitch
          title="임박·만료 알림"
          description="D-3 이내 재료와 오늘까지인 재료를 알려드려요"
          checked={expirationEnabled}
          disabled={preferenceMutation.isPending}
          onChange={() => preferenceMutation.mutate(!expirationEnabled)}
        />

        <SettingSwitch
          title="이 기기 푸시 수신"
          description={
            push.status === null
              ? "기기 상태 확인 중"
              : {
                  on: "이 기기에서 푸시를 받을 수 있어요",
                  off: "켜면 알림 권한을 요청하고 이 기기를 등록해요",
                  blocked: "기기 또는 브라우저 설정에서 알림을 허용해 주세요",
                  "blocked-ios": "알림 권한 설정 방법을 확인해 주세요",
                  "needs-install": "홈 화면에 앱을 추가한 후 받을 수 있어요",
                  unsupported: "이 브라우저에서는 푸시를 지원하지 않아요",
                }[push.status]
          }
          checked={push.status === "on"}
          disabled={push.status === null || push.isPending}
          onChange={push.handleClick}
        />

        <div className="flex min-h-[112px] items-center justify-between gap-4 rounded-[24px] bg-app-neutral-100 px-5 py-5">
          <div className="min-w-0">
            <p className="m-0 font-app-heading text-[18px] font-black text-app-ink">
              받는 시각
            </p>
            <p className="m-0 mt-2 text-[13px] leading-5 text-app-ink/55">
              매일 오전 8시 1회 고정
            </p>
          </div>
          <span className="shrink-0 text-[13px] text-app-ink/35">
            변경 불가
          </span>
        </div>
      </div>
      <PushInstallGuideSheet
        open={push.isGuideOpen}
        onDismiss={push.closeGuide}
      />
      <PushPermissionGuideSheet
        open={push.isPermissionGuideOpen}
        onDismiss={push.closePermissionGuide}
      />
    </main>
  );
}
