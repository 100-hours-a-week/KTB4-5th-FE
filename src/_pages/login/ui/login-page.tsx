import Image from "next/image";
import { Suspense } from "react";

import stackedLogo from "@/shared/assets/logo/logo-stacked.webp";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { LoginFlowProvider } from "../model/login-flow-provider";
import { LoginFormProvider } from "../model/login-form-provider";
import { LoginFooterAction } from "./login-footer-action";
import { LoginForm } from "./login-form";
import { LoginNotiOnboarding } from "./login-noti-onboarding";
import { LoginRedirectNotice } from "./login-redirect-notice";

export function LoginPage() {
  return (
    <LoginFlowProvider>
      <Suspense fallback={null}>
        <LoginRedirectNotice />
      </Suspense>
      <LoginFormProvider>
        <PageActionLayout action={<LoginFooterAction />}>
          <div className="block group-data-[login-step=notification-onboarding]:!hidden">
            <div className="px-5 pt-[calc(54px+var(--safe-top))] pb-5">
              <div className="text-center">
                <Image
                  src={stackedLogo}
                  alt="다먹자"
                  sizes="200px"
                  priority
                  className="mx-auto size-[200px] rounded-2xl"
                />
                <p className="mb-0 mt-1 text-[16px] leading-[1.35] text-app-ink/60">
                  유통기한 걱정 없이,
                  <br />
                  냉장고 속 재료를 알뜰하게
                </p>
              </div>

              <LoginForm />
            </div>
          </div>

          <div className="hidden group-data-[login-step=notification-onboarding]:!block">
            <LoginNotiOnboarding />
          </div>
        </PageActionLayout>
      </LoginFormProvider>
    </LoginFlowProvider>
  );
}
