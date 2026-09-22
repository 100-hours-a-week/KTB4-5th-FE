"use client";

import { useFormState } from "react-hook-form";

import type { LoginFormValues } from "@/features/login";
import { Button } from "@/shared/ui/button";

import { useLoginFlow } from "../model/login-flow-provider";
import { useEnterHome } from "../model/use-enter-home";

export function LoginFooterAction() {
  const { step } = useLoginFlow();
  const { enterHome, isPending } = useEnterHome();
  // SERVICE_COMMON_RULES §5.1: 오류가 있거나 필수 값이 비면 주 버튼을 비활성화한다.
  const { isValid, isSubmitting } = useFormState<LoginFormValues>();

  if (step === "login") {
    return (
      <Button
        type="submit"
        form="login-form"
        variant="highlight"
        shape="note"
        className="w-full shadow-app-md"
        loading={isSubmitting}
        disabled={!isValid}
      >
        {isSubmitting ? "로그인 중" : "시작하기"}
      </Button>
    );
  }

  if (isPending) {
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
