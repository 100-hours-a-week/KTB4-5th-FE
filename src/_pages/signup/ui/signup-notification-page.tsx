"use client";

import { ArrowLeftOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  getPushNotificationSupport,
  requestPushPermission,
  resubscribePushNotificationsIfEnabled,
} from "@/features/manage-push-notifications";
import {
  getOAuthSignupError,
  useCompleteOAuthSignup,
} from "@/features/oauth-signup";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppHeader } from "@/shared/ui/app-header";
import { showAppToast } from "@/shared/ui/app-toast";
import { Button } from "@/shared/ui/button";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { useSignupDraftStore } from "../model/use-signup-draft-store";

export function SignupNotificationPage() {
  const router = useRouter();
  const [isEnteringHome, startTransition] = useTransition();
  const nickname = useSignupDraftStore((state) => state.nickname);
  const notificationEnabled = useSignupDraftStore(
    (state) => state.notificationEnabled,
  );
  const setNotificationEnabled = useSignupDraftStore(
    (state) => state.setNotificationEnabled,
  );
  const setNicknameError = useSignupDraftStore(
    (state) => state.setNicknameError,
  );
  const reset = useSignupDraftStore((state) => state.reset);

  const signupMutation = useCompleteOAuthSignup();
  const resubscribeMutation = useMutation({
    meta: { monitoringOperation: "push.resubscribe" },
    mutationFn: resubscribePushNotificationsIfEnabled,
  });

  async function startService() {
    if (notificationEnabled && getPushNotificationSupport() === "supported") {
      await requestPushPermission().catch(() => null);
    }

    try {
      await signupMutation.mutateAsync({
        nickname: nickname.trim(),
        notificationSetting: notificationEnabled,
      });
    } catch (error) {
      const signupError = getOAuthSignupError(error);

      if (signupError.kind === "nickname") {
        setNicknameError(signupError.message);
        router.replace(routes.signupProfile);
      } else if (signupError.kind === "restart") {
        reset();
        router.replace(routes.loginWithReason(signupError.reason));
      } else {
        showAppToast({ message: signupError.message, variant: "error" });
      }
      return;
    }

    reset();
    if (notificationEnabled) {
      resubscribeMutation.mutate();
    }
    startTransition(() => {
      markAppNavigationIntent("replace", routes.home);
      router.replace(routes.home);
    });
  }

  return (
    <PageActionLayout
      action={
        <Button
          variant="highlight"
          shape="note"
          className="w-full shadow-app-md"
          loading={signupMutation.isPending || isEnteringHome}
          onClick={startService}
        >
          시작하기
        </Button>
      }
    >
      <AppHeader
        title="알림 설정"
        leading={
          <Link
            href={routes.signupProfile}
            aria-label="정보 입력으로 돌아가기"
            className="grid size-[var(--tap-min)] place-items-center text-app-text hover:text-app-primary"
          >
            <Lineicons
              icon={ArrowLeftOutlined}
              size={23}
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            />
          </Link>
        }
      />

      <div className="px-5 pt-3 pb-5">
        <h2 className="m-0 text-[24px] leading-[1.35] text-app-ink">
          매일 아침,
          <br />
          오늘 챙길 재료를 알려드릴게요
        </h2>

        <div className="mt-6 rounded-[4px] bg-white px-5 py-5 shadow-app-sm">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="font-app-heading text-[17px] font-black text-app-ink">
              알림 받기
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={notificationEnabled}
              onChange={(event) => setNotificationEnabled(event.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="relative h-8 w-[52px] flex-none rounded-full bg-app-neutral-300 transition-colors peer-checked:bg-app-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-app-ink after:absolute after:top-1 after:left-1 after:size-6 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
            />
          </label>
          <p className="mb-0 mt-3 text-[15px] font-bold text-app-ink">
            매일 오전 8시 · 1회 고정
          </p>
          <p className="mb-0 mt-2 text-sm leading-5 text-app-neutral-700">
            임박(D-3 이내) 재료와 오늘 만료되는 재료를 한 번에 받아보세요.
          </p>
        </div>

        <p className="mb-0 mt-4 text-sm leading-5 text-app-ink/55">
          알림 주기는 앱 설정에서 언제든 끌 수 있어요.
        </p>
      </div>
    </PageActionLayout>
  );
}
