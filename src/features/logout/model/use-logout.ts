"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setCurrentRefrigeratorId } from "@/entities/refrigerator";
import { ApiError, refreshCsrfToken } from "@/shared/api";
import { routes } from "@/shared/routes";
import { showAppToast } from "@/shared/ui/app-toast";

import { logout } from "../api/logout";

const LOGOUT_ERROR_MESSAGE = "로그아웃하지 못했어요. 다시 시도해 주세요";

// 이미 세션이 끊긴 상태의 로그아웃은 실패가 아니라 이미 끝난 일로 본다.
// DELETE /auth/sessions는 인증 API라 401을 자동 갱신하지 않는다(§8.4).
function isAlreadyLoggedOut(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function useLogout() {
  const queryClient = useQueryClient();

  function leaveSession() {
    // 이동 방식 매트릭스: 로그아웃 → 로그인은 replace + queryClient.clear().
    queryClient.clear();
    setCurrentRefrigeratorId(null);
    // docs/AUTH_SESSION_SECURITY.md §8.3: 인증 상태 변경 직후 CSRF 재발급.
    // 아래 문서 교체로 중간에 끊길 수 있지만, 새로 뜨는 화면의
    // CsrfBootstrapProvider가 같은 일을 한 번 더 한다.
    void refreshCsrfToken();
    // 세션 만료 처리(query-provider)와 같은 방식으로 문서 자체를 교체한다.
    // router.replace는 Next 라우터 캐시에 남은 이전 사용자의 보호 화면을
    // 그대로 두기 때문에, 뒤로가기로 그 화면이 다시 보일 수 있다.
    window.location.replace(routes.login);
  }

  return useMutation({
    mutationFn: logout,
    onSuccess: leaveSession,
    onError: (error) => {
      if (isAlreadyLoggedOut(error)) {
        leaveSession();
        return;
      }

      showAppToast({
        message: LOGOUT_ERROR_MESSAGE,
        variant: "error",
        dedupeKey: "logout-error",
      });
    },
  });
}
