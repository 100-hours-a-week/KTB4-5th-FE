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
import { useEnterHome } from "../model/use-enter-home";

// SERVICE_COMMON_RULES §5.1 표준 문구. 계정이 없는지 비밀번호가 틀렸는지는
// 구분해서 보여주지 않는다(계정 존재 여부 노출 방지).
const CREDENTIAL_ERROR_MESSAGE = "아이디 또는 비밀번호를 확인해 주세요";
const NETWORK_ERROR_MESSAGE = "인터넷 연결을 확인해 주세요";
const SERVER_ERROR_TYPE = "server";

export function LoginForm() {
  const { showNotificationOnboarding } = useLoginFlow();
  const { enterHome } = useEnterHome();
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

      // 신규 가입 루트로 왔을 때만 알림 온보딩을 보여준다. 기존 계정
      // 로그인은 곧장 홈으로 들어간다.
      if (isNewAccount) {
        showNotificationOnboarding();
      } else {
        enterHome();
      }
    } catch (error) {
      // 400(형식) · 401(비밀번호 오류로 추정) · 404(회원가입까지 실패한 경우)
      // · 422(아이디 사용 불가)는 전부 같은 문구로 합친다. 그 외(CSRF
      // 재시도까지 실패, 5xx, 네트워크 단절)는 네트워크 문구로 대체한다.
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
            // 실패 문구는 아이디·비밀번호 둘 다에 대한 것이라 아이디를 고쳐도
            // 지워야 한다. 비밀번호 형식 오류(스키마)는 그대로 둔다.
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
