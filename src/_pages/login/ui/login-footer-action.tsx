"use client";

import { useFormState } from "react-hook-form";

import type { LoginFormValues } from "@/features/login";
import { Button } from "@/shared/ui/button";

import { useLoginFlow } from "../model/login-flow-provider";

export function LoginFooterAction() {
  const { step, enterHome, isEnteringHome } = useLoginFlow();
  const { isValid, isSubmitting } = useFormState<LoginFormValues>();

  if (step === "login") {
    const isEntering = isSubmitting || isEnteringHome;

    return (
      <Button
        type="submit"
        form="login-form"
        variant="highlight"
        shape="note"
        className="w-full shadow-app-md"
        loading={isEntering}
        disabled={!isValid}
      >
        {isEntering ? "로그인 중" : "시작하기"}
      </Button>
    );
  }

  if (isEnteringHome) {
    return (
      <div
        className="text-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Button
          disabled
          variant="highlight"
          shape="note"
          className="w-full shadow-app-md disabled:bg-app-warning disabled:text-app-ink"
        >
          <span
            aria-hidden="true"
            className="size-[17px] shrink-0 animate-spin rounded-full border-[2.5px] border-app-ink/30 border-t-app-ink"
          />
          냉장고 만들고 있어요
        </Button>
        <p className="mb-0 mt-2 text-[15px] text-app-ink/45">
          몇 초면 끝나요. 앱을 닫지 말아주세요
        </p>
      </div>
    );
  }

  return (
    <Button
      variant="highlight"
      shape="note"
      className="w-full shadow-app-md"
      onClick={enterHome}
    >
      시작하기
    </Button>
  );
}
