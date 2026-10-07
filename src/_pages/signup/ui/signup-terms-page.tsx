"use client";

import { ArrowLeftOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useRouter } from "next/navigation";

import { routes } from "@/shared/routes";
import { AppHeader } from "@/shared/ui/app-header";
import { Button } from "@/shared/ui/button";
import { CheckMark } from "@/shared/ui/check-mark";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { TERMS, useSignupDraftStore } from "../model/use-signup-draft-store";

export function SignupTermsPage() {
  const router = useRouter();
  const agreed = useSignupDraftStore((state) => state.agreed);
  const setAgreed = useSignupDraftStore((state) => state.setAgreed);
  const reset = useSignupDraftStore((state) => state.reset);

  const isAllAgreed = TERMS.every((term) => agreed[term.id]);
  const canProceed = TERMS.every((term) => !term.required || agreed[term.id]);

  function leaveSignup() {
    reset();
    router.replace(routes.oauthLogin);
  }

  function toggleAll(checked: boolean) {
    setAgreed(Object.fromEntries(TERMS.map((term) => [term.id, checked])));
  }

  return (
    <PageActionLayout
      action={
        <Button
          variant="highlight"
          shape="note"
          className="w-full shadow-app-md"
          disabled={!canProceed}
          onClick={() => router.push(routes.signupProfile)}
        >
          다음
        </Button>
      }
    >
      <AppHeader
        title="약관 동의"
        leading={
          <button
            type="button"
            onClick={leaveSignup}
            aria-label="로그인으로 돌아가기"
            className="grid size-[var(--tap-min)] place-items-center border-0 bg-transparent p-0 text-app-text hover:text-app-primary"
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

      <div className="px-5 pt-3 pb-5">
        <h2 className="m-0 text-[24px] leading-[1.35] text-app-ink">
          서비스 이용을 위해
          <br />
          약관에 동의해 주세요
        </h2>

        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-[4px] bg-white px-4 py-[18px] shadow-app-sm">
          <input
            type="checkbox"
            checked={isAllAgreed}
            onChange={(event) => toggleAll(event.target.checked)}
            className="peer sr-only"
          />
          <CheckMark />
          <span className="font-app-heading text-[16px] font-black">
            전체 동의합니다
          </span>
        </label>

        <ul className="m-0 mt-4 list-none p-0">
          {TERMS.map((term) => (
            <li key={term.id}>
              <label className="flex min-h-[var(--tap-min)] cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={agreed[term.id] ?? false}
                  onChange={(event) =>
                    setAgreed({ ...agreed, [term.id]: event.target.checked })
                  }
                  className="peer sr-only"
                />
                <CheckMark />
                <span className="min-w-0 flex-1 text-[15px] leading-[1.35] text-app-ink">
                  <span
                    className={
                      term.required
                        ? "font-bold text-app-primary"
                        : "font-bold text-app-neutral-500"
                    }
                  >
                    [{term.required ? "필수" : "선택"}]
                  </span>{" "}
                  {term.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </PageActionLayout>
  );
}
