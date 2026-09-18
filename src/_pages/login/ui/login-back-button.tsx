"use client";

import { useLoginFlow } from "../model/login-flow-provider";

// TODO: API 연결 후 삭제 고려
export function LoginBackButton() {
  const { showLogin } = useLoginFlow();

  return (
    <button
      type="button"
      aria-label="로그인으로 돌아가기"
      className="inline-flex min-h-11 w-11 items-center justify-start text-[30px] leading-none text-app-canvas hover:text-app-warning"
      onClick={showLogin}
    >
      <span aria-hidden="true">‹</span>
    </button>
  );
}
