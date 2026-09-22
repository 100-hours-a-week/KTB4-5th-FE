"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setCurrentRefrigeratorId } from "@/entities/refrigerator";
import { ApiError, refreshCsrfToken } from "@/shared/api";

import { login, type LoginRequest, type LoginResult } from "../api/login";
import { signup } from "../api/signup";

// 실측 확인(2026-09-22): 계정이 없는 아이디로 POST /auth/sessions를 호출하면
// 404 AUTH-404-001 "존재하지 않는 아이디입니다"가 온다. /login 한 화면에서
// 로그인·회원가입을 모두 처리하기로 했으므로, 이 코드일 때만 회원가입으로
// 넘어간다 — 그 외 실패(형식 오류, 비밀번호 오류 등)는 그대로 에러로 올린다.
const ACCOUNT_NOT_FOUND_CODE = "AUTH-404-001";

export type LoginOrSignupResult = {
  data: LoginResult;
  isNewAccount: boolean;
};

async function loginOrSignup(
  request: LoginRequest,
): Promise<LoginOrSignupResult> {
  try {
    const response = await login(request);
    return { data: response.data, isNewAccount: false };
  } catch (error) {
    if (error instanceof ApiError && error.code === ACCOUNT_NOT_FOUND_CODE) {
      const response = await signup(request);
      return { data: response.data, isNewAccount: true };
    }

    throw error;
  }
}

export function useLoginOrSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginOrSignup,
    onSuccess: ({ data }) => {
      // 계정이 바뀌면 이전 사용자의 재고 캐시를 제거하고 응답의 냉장고를 선택한다.
      queryClient.removeQueries();
      setCurrentRefrigeratorId(data.activeRefrigeratorIds[0] ?? null);
      // docs/AUTH_SESSION_SECURITY.md §8.3: 인증 상태 변경 직후 CSRF 재발급.
      void refreshCsrfToken();
    },
  });
}
