"use client";

import { FieldHelperText } from "@/shared/ui/field-helper-text";

import { useLoginFlow } from "../model/login-flow-provider";

export function LoginForm() {
  const { showNotificationOnboarding } = useLoginFlow();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    showNotificationOnboarding();
  }

  return (
    <form
      id="login-form"
      onSubmit={handleSubmit}
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
        />
        <FieldHelperText id="username-help" hint="2~10자 · 한글·영문·숫자만" />
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
        />
        <FieldHelperText id="password-help" hint="8자 이상 · 영문+숫자 조합" />
      </div>

      <p className="mb-0 px-1 pt-0.5 text-[15px] leading-5 text-app-ink/60">
        처음 보는 아이디면 그대로 가입돼요. 아이디가 냉장고 이름이 돼요!
      </p>
    </form>
  );
}
