import { ArrowLeftOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import Link from "next/link";

import { routes } from "@/shared/routes";
import { AppHeader } from "@/shared/ui/app-header";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { LoginFlowProvider } from "../model/login-flow-provider";
import { LoginFormProvider } from "../model/login-form-provider";
import { LoginFooterAction } from "./login-footer-action";
import { LoginForm } from "./login-form";

export function LocalLoginPage() {
  return (
    <LoginFlowProvider>
      <LoginFormProvider>
        <PageActionLayout action={<LoginFooterAction />}>
          <AppHeader
            title="아이디로 로그인"
            leading={
              <Link
                href={routes.login}
                replace
                aria-label="카카오 로그인으로 돌아가기"
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
            <p className="m-0 text-[14px] leading-5 text-app-ink/60">
              카카오 로그인 이전에 만든 아이디로 로그인해요
            </p>
            <LoginForm />
          </div>
        </PageActionLayout>
      </LoginFormProvider>
    </LoginFlowProvider>
  );
}
