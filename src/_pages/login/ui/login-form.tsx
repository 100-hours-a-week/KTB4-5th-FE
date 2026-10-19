"use client";

import { useMutation } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";

import { LOGIN_ID_HINT, PASSWORD_HINT, useLogin } from "@/features/login";
import type { LoginFormValues } from "@/features/login";
import { resubscribePushNotificationsIfEnabled } from "@/features/manage-push-notifications";
import { ApiError } from "@/shared/api";
import { FieldHelperText } from "@/shared/ui/field-helper-text";

import { useLoginFlow } from "../model/login-flow-provider";

const CREDENTIAL_ERROR_MESSAGE = "아이디 또는 비밀번호를 확인해 주세요";
const NETWORK_ERROR_MESSAGE = "인터넷 연결을 확인해 주세요";
const SERVER_ERROR_MESSAGE = "잠시 후 다시 시도해 주세요";
const SERVER_ERROR_TYPE = "server";

type LoginError = {
  field: keyof LoginFormValues;
  message: string;
};

function getLoginError(error: unknown): LoginError {
  if (error instanceof ApiError) {
    return {
      field: "password",
      message: [400, 401, 404, 422].includes(error.status)
        ? CREDENTIAL_ERROR_MESSAGE
        : SERVER_ERROR_MESSAGE,
    };
  }
  if (error instanceof TypeError) {
    return { field: "password", message: NETWORK_ERROR_MESSAGE };
  }
  return { field: "password", message: SERVER_ERROR_MESSAGE };
}

export function LoginForm() {
  const { enterHome } = useLoginFlow();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    getFieldState,
    formState: { errors },
  } = useFormContext<LoginFormValues>();
  const loginMutation = useLogin();
  const resubscribeMutation = useMutation({
    meta: { monitoringOperation: "push.resubscribe" },
    mutationFn: resubscribePushNotificationsIfEnabled,
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await loginMutation.mutateAsync(values);
      resubscribeMutation.mutate();
      enterHome();
    } catch (error) {
      const loginError = getLoginError(error);

      setError(loginError.field, {
        type: SERVER_ERROR_TYPE,
        message: loginError.message,
      });
    }
  }

  return (
    <form
      id="login-form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="mt-[34px] flex flex-col gap-[14px]"
    >
      <div className="rounded-[4px] bg-white px-4 py-[14px] shadow-app-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-app-primary">
        <label
          htmlFor="username"
          className="block text-xs font-bold text-app-ink/50"
        >
          아이디
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          aria-describedby="username-help"
          placeholder="아이디를 입력해주세요"
          className="mt-1 w-full border-0 bg-transparent p-0 text-[16px] font-bold text-app-ink outline-none placeholder:text-app-neutral-400"
          {...register("loginId", {
            onChange: () => {
              if (getFieldState("loginId").error?.type === SERVER_ERROR_TYPE) {
                clearErrors("loginId");
              }
              if (getFieldState("password").error?.type === SERVER_ERROR_TYPE) {
                clearErrors("password");
              }
            },
          })}
        />
        <FieldHelperText
          id="username-help"
          hint={LOGIN_ID_HINT}
          error={errors.loginId?.message}
        />
      </div>

      <div className="rounded-[4px] bg-white px-4 py-[14px] shadow-app-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-app-primary">
        <label
          htmlFor="password"
          className="block text-xs font-bold text-app-ink/50"
        >
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-describedby="password-help"
          placeholder="비밀번호를 입력해주세요"
          className="mt-1 w-full border-0 bg-transparent p-0 text-[16px] font-bold text-app-ink outline-none placeholder:text-app-neutral-400"
          {...register("password", {
            onChange: () => {
              if (getFieldState("password").error?.type === SERVER_ERROR_TYPE) {
                clearErrors("password");
              }
            },
          })}
        />
        <FieldHelperText
          id="password-help"
          hint={PASSWORD_HINT}
          error={errors.password?.message}
        />
      </div>
    </form>
  );
}
