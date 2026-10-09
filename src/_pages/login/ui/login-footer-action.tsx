"use client";

import { useFormState } from "react-hook-form";

import type { LoginFormValues } from "@/features/login";
import { Button } from "@/shared/ui/button";

import { useLoginFlow } from "../model/login-flow-provider";

export function LoginFooterAction() {
  const { isEnteringHome } = useLoginFlow();
  const { isValid, isSubmitting } = useFormState<LoginFormValues>();
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
      {isEntering ? "로그인 중" : "로그인"}
    </Button>
  );
}
