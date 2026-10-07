import Image from "next/image";
import Link from "next/link";

import stackedLogo from "@/shared/assets/logo/logo-stacked.webp";
import { routes } from "@/shared/routes";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

export function OAuthLoginPage() {
  return (
    <PageActionLayout
      action={
        <div className="flex flex-col gap-4">
          <p className="m-0 text-center text-[13px] leading-5 text-app-ink/55">
            가입 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
          </p>
          <Link
            href={routes.signupTerms}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[4px] bg-[#FEE500] px-5 py-3 font-app-heading text-[15px] font-black text-black/85 shadow-app-md hover:brightness-95"
          >
            <svg
              viewBox="0 0 18 18"
              aria-hidden="true"
              focusable="false"
              className="size-[18px] fill-black"
            >
              <path d="M9 1.5C4.58 1.5 1 4.32 1 7.8c0 2.24 1.49 4.2 3.73 5.32l-.95 3.48c-.08.3.26.54.52.37l4.15-2.74c.18.02.36.03.55.03 4.42 0 8-2.82 8-6.3S13.42 1.5 9 1.5z" />
            </svg>
            카카오로 시작하기
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
  );
}
