"use client";

import { ArrowLeftOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { usePathname, useRouter } from "next/navigation";

import { NotificationBell } from "@/entities/notification";
import { runAppBackGuard } from "@/shared/lib/navigation-guard";
import {
  markAppNavigationIntent,
  readAppNavigationDepth,
} from "@/shared/lib/navigation-history";
import { AppHeader } from "@/shared/ui/app-header";

import {
  getRouteHeaderPolicy,
  type RouteHeaderMode,
} from "../model/route-header-policy";

type RouteHeaderProps = {
  mode: RouteHeaderMode;
  homeTitle?: string;
  unreadNotificationCount?: number;
};

export function RouteHeader({
  mode,
  homeTitle,
  unreadNotificationCount,
}: RouteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const policy = getRouteHeaderPolicy(pathname, mode, { home: homeTitle });

  if (policy.kind === "tabs") {
    return (
      <AppHeader
        title={policy.title}
        actions={
          policy.showNotifications ? (
            <NotificationBell unreadCount={unreadNotificationCount} />
          ) : undefined
        }
      />
    );
  }

  const { backFallbackHref } = policy;

  function goBack() {
    if ((readAppNavigationDepth() ?? 0) > 0) {
      router.back();
      return;
    }

    markAppNavigationIntent("replace", backFallbackHref);
    router.replace(backFallbackHref);
  }

  // 작성 중 이탈 확인처럼 화면이 판단하는 업무 조건은 가드가 이동을 가로챈다.
  function navigateBack() {
    if (runAppBackGuard(goBack)) {
      return;
    }

    goBack();
  }

  return (
    <AppHeader
      title={policy.title}
      leading={
        <button
          className="grid size-[var(--tap-min)] place-items-center border-0 bg-transparent p-0 text-app-text hover:text-app-primary"
          type="button"
          onClick={navigateBack}
          aria-label="이전 화면으로 이동"
        >
          <Lineicons
            icon={ArrowLeftOutlined}
            size={23}
            strokeWidth={1.8}
            aria-hidden="true"
            focusable="false"
          />
        </button>
      }
    />
  );
}
