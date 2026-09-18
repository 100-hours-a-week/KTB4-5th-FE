import Image from "next/image";

import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { LoginFlowProvider } from "../model/login-flow-provider";
import { LoginFooterAction } from "./login-footer-action";
import { LoginForm } from "./login-form";
import { LoginNotiOnboarding } from "./login-noti-onboarding";

export function LoginPage() {
  return (
    <LoginFlowProvider>
      <PageActionLayout
        pageClassName="bg-app-canvas group-data-[login-step=notification-onboarding]:bg-app-ink group-data-[login-step=notification-onboarding]:text-app-canvas"
        footerClassName="group-data-[login-step=notification-onboarding]:bg-app-ink"
        action={<LoginFooterAction />}
      >
        <div className="block group-data-[login-step=notification-onboarding]:!hidden">
          <div className="px-5 pt-[calc(54px+var(--safe-top))] pb-5">
            <div className="text-center">
              <Image
                src="/icons/horizontal_logo.png"
                alt="다먹자 앱 아이콘"
                width={200}
                height={200}
                priority
                className="mx-auto size-[200px] rounded-2xl"
              />
              <p className="mb-0 mt-1 text-lg leading-[1.35] text-app-ink/60">
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
    </LoginFlowProvider>
  );
}
