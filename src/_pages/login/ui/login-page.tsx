import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { KakaoLoginButton } from "@/features/oauth-login";
import stackedLogo from "@/shared/assets/logo/logo-stacked.webp";
import { routes } from "@/shared/routes";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { LoginRedirectNotice } from "./login-redirect-notice";

export function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <LoginRedirectNotice />
      </Suspense>
      <PageActionLayout
        action={
          <div className="flex flex-col gap-4">
            <p className="m-0 text-center text-[13px] leading-5 text-app-ink/55">
              가입 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
            </p>
            <KakaoLoginButton />
            <Link
              href={routes.localLogin}
              className="mx-auto inline-flex min-h-[var(--tap-min)] items-center px-2 text-[14px] text-app-neutral-600 underline underline-offset-2 hover:text-app-ink"
            >
              기존 아이디로 로그인
            </Link>
          </div>
        }
      >
        <div className="flex min-h-full flex-col items-center justify-center px-5 pt-[var(--safe-top)] pb-5 text-center">
          <Image
            src={stackedLogo}
            alt="다먹자"
            sizes="200px"
            priority
            className="size-[200px] rounded-2xl"
          />
          <p className="mb-0 mt-1 text-[16px] leading-[1.35] text-app-ink/60">
            유통기한 걱정 없이,
            <br />
            냉장고 속 재료를 알뜰하게
          </p>
        </div>
      </PageActionLayout>
    </>
  );
}
