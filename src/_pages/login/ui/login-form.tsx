"use client";

import { useFormContext } from "react-hook-form";

import {
  LOGIN_ID_HINT,
  PASSWORD_HINT,
  useLoginOrSignup,
} from "@/features/login";
import type { LoginFormValues } from "@/features/login";
import { ApiError } from "@/shared/api";
import { FieldHelperText } from "@/shared/ui/field-helper-text";

import { useLoginFlow } from "../model/login-flow-provider";

const CREDENTIAL_ERROR_MESSAGE = "아이디 또는 비밀번호를 확인해 주세요";
const NETWORK_ERROR_MESSAGE = "인터넷 연결을 확인해 주세요";
const SERVER_ERROR_TYPE = "server";

export function LoginForm() {
  const { enterHome, showNotificationOnboarding } = useLoginFlow();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    getFieldState,
    formState: { errors },
  } = useFormContext<LoginFormValues>();
  const loginOrSignupMutation = useLoginOrSignup();

  async function onSubmit(values: LoginFormValues) {
    try {
      const { isNewAccount } = await loginOrSignupMutation.mutateAsync(values);

      if (isNewAccount) {
        showNotificationOnboarding();
      } else {
        enterHome();
      }
    } catch (error) {
      const isCredentialError =
        error instanceof ApiError &&
        [400, 401, 404, 422].includes(error.status);

      setError("password", {
        type: SERVER_ERROR_TYPE,
        message: isCredentialError
          ? CREDENTIAL_ERROR_MESSAGE
          : NETWORK_ERROR_MESSAGE,
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
          className="mt-1 w-full border-0 bg-transparent p-0 text-[17px] font-bold text-app-ink outline-none placeholder:text-app-neutral-400"
          {...register("loginId", {
            onChange: () => {
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
          className="mt-1 w-full border-0 bg-transparent p-0 text-[17px] font-bold text-app-ink outline-none placeholder:text-app-neutral-400"
          {...register("password")}
        />
        <FieldHelperText
          id="password-help"
          hint={PASSWORD_HINT}
          error={errors.password?.message}
        />
      </div>

      <p className="mb-0 px-1 pt-0.5 text-[15px] leading-5 text-app-ink/60">
        처음 보는 아이디면 그대로 가입돼요. 아이디가 냉장고 이름이 돼요!
      </p>
    </form>
  );
}
