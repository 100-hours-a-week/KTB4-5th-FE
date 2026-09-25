"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  isExpirationNotificationEnabled,
  notificationQueries,
  useNotificationSessionScope,
} from "@/entities/notification";
import { readPushSubscriptionId } from "@/entities/push-subscription";
import { SessionExpiredError } from "@/shared/api";
import { showAppToast } from "@/shared/ui/app-toast";

import {
  getPushNotificationSupport,
  registerWebPush,
  requestPushPermission,
} from "./push-notification-subscription";

/**
 * - `on`: 서버 알림 설정이 켜져 있고, 권한이 허용되고 이 기기의 구독이 서버에 등록됐다.
 * - `off`: 서버 알림 설정이 꺼졌거나, 권한 요청 전이거나 구독이 없다.
 * - `blocked`: OS·브라우저에서 알림 권한을 거부했다. 앱에서 다시 요청할 수 없다.
 * - `needs-install`: iOS에서 홈 화면에 추가해야 한다.
 * - `unsupported`: 이 환경에서는 푸시를 쓸 수 없다.
 */
export type PushNotificationSettingStatus =
  "on" | "off" | "blocked" | "needs-install" | "unsupported";

export const pushNotificationStatusLabels: Record<
  PushNotificationSettingStatus,
  string
> = {
  on: "켜짐",
  off: "꺼짐",
  blocked: "휴대폰 설정 확인 필요",
  "needs-install": "꺼짐",
  unsupported: "꺼짐",
};

async function readDeviceStatus(): Promise<PushNotificationSettingStatus> {
  const support = getPushNotificationSupport();

  if (support !== "supported") {
    return support;
  }

  if (Notification.permission === "denied") {
    return "blocked";
  }

  if (Notification.permission !== "granted") {
    return "off";
  }

  // SW가 아직 활성화되지 않았으면 ready가 끝나지 않으므로 등록 정보만 즉시 조회한다.
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();

  // 브라우저 구독만 있고 서버 등록에 실패한 경우는 꺼짐으로 보고 다시 등록하게 한다.
  return subscription && readPushSubscriptionId() ? "on" : "off";
}

/**
 * 알림 설정 진입점의 상태 표시와 클릭 동작을 소유한다.
 */
export function usePushNotificationSetting() {
  const [deviceStatus, setDeviceStatus] =
    useState<PushNotificationSettingStatus | null>(null);
  const sessionScope = useNotificationSessionScope();
  const preferencesQuery = useQuery({
    ...notificationQueries.preferences(sessionScope ?? ""),
    enabled: sessionScope !== undefined,
  });
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const registerMutation = useMutation({
    mutationFn: registerWebPush,
    onSuccess: (result) => {
      if (result.status === "subscribed") {
        setDeviceStatus("on");
        showAppToast({ message: "알림을 켰어요", variant: "success" });
        return;
      }

      showEnableErrorToast();
    },
    onError: (error) => {
      // 세션 만료는 MutationCache가 로그인으로 보낸다.
      if (!(error instanceof SessionExpiredError)) showEnableErrorToast();
    },
  });

  const isPending = isRequestingPermission || registerMutation.isPending;
  const status = preferencesQuery.isLoading
    ? null
    : resolveStatus(
        deviceStatus,
        preferencesQuery.data &&
          isExpirationNotificationEnabled(
            preferencesQuery.data.notificationPreferences,
          ),
      );

  useEffect(() => {
    let ignore = false;

    void readDeviceStatus()
      .catch((): PushNotificationSettingStatus => "off")
      .then((nextStatus) => {
        if (!ignore) setDeviceStatus(nextStatus);
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function enable() {
    setIsRequestingPermission(true);

    try {
      const permission = await requestPushPermission();

      if (permission === "denied") {
        setDeviceStatus("blocked");
        showBlockedToast();
        return;
      }

      if (permission === "granted") {
        registerMutation.mutate();
      }
    } catch {
      showEnableErrorToast();
    } finally {
      setIsRequestingPermission(false);
    }
  }

  function handleClick() {
    if (status === null || isPending) return;

    switch (status) {
      case "needs-install":
        setIsGuideOpen(true);
        return;
      case "unsupported":
        showAppToast({
          message: "이 브라우저에서는 알림을 받을 수 없어요",
          variant: "error",
          dedupeKey: "push-notification-unsupported",
        });
        return;
      case "blocked":
        showBlockedToast();
        return;
      case "on":
        return;
      case "off":
        void enable();
        return;
    }
  }

  return {
    status,
    isPending,
    isGuideOpen,
    closeGuide: () => setIsGuideOpen(false),
    handleClick,
  };
}

function resolveStatus(
  deviceStatus: PushNotificationSettingStatus | null,
  isExpirationEnabled: boolean | undefined,
): PushNotificationSettingStatus | null {
  if (deviceStatus === "on" && isExpirationEnabled === false) return "off";

  return deviceStatus;
}

function showEnableErrorToast() {
  showAppToast({
    message: "알림을 켜지 못했어요",
    variant: "error",
    dedupeKey: "push-notification-enable-error",
  });
}

function showBlockedToast() {
  showAppToast({
    message: "휴대폰 설정에서 알림을 켜주세요",
    variant: "error",
    dedupeKey: "push-notification-blocked",
  });
}
