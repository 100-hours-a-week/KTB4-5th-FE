"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setCurrentRefrigeratorId } from "@/entities/refrigerator";
import { refreshCsrfToken } from "@/shared/api";

import { login } from "../api/login";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: ({ data }) => {
      // 계정이 바뀌면 이전 사용자의 재고 캐시를 제거하고 응답의 냉장고를 선택한다.
      queryClient.removeQueries();
      setCurrentRefrigeratorId(data.activeRefrigeratorIds[0] ?? null);
      // docs/AUTH_SESSION_SECURITY.md §8.3: 인증 상태 변경 직후 CSRF 재발급.
      void refreshCsrfToken();
    },
  });
}
