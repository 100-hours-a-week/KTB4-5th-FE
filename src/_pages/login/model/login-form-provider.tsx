"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { loginFormSchema, type LoginFormValues } from "@/features/login";

type LoginFormProviderProps = {
  children: ReactNode;
};

// LoginForm(실제 <form>)과 LoginFooterAction(다른 위치의 제출 버튼)이
// 같은 폼 상태를 봐야 해서 상위에서 한 번만 useForm을 호출해 공유한다.
// (register-ingredient-manual의 ManualRegisterForm/RegisterSubmitButton과 같은 패턴)
export function LoginFormProvider({ children }: LoginFormProviderProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: "onChange",
    defaultValues: { loginId: "", password: "" },
  });

  return <FormProvider {...form}>{children}</FormProvider>;
}
