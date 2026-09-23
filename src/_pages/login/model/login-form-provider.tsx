"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { loginFormSchema, type LoginFormValues } from "@/features/login";

type LoginFormProviderProps = {
  children: ReactNode;
};

export function LoginFormProvider({ children }: LoginFormProviderProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: "onChange",
    defaultValues: { loginId: "", password: "" },
  });

  return <FormProvider {...form}>{children}</FormProvider>;
}
