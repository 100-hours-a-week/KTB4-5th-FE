"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";

// COMMON_COMPONENT_RULES 이동 방식 매트릭스: "로그인 성공 → 홈: replace".
// 뒤로가기로 로그인 화면이 다시 노출되지 않게 한다. 기존 계정 로그인(온보딩
// 건너뜀)과 알림 온보딩의 "시작하기" 둘 다 같은 방식으로 홈에 들어간다.
export function useEnterHome() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function enterHome() {
    startTransition(() => {
      markAppNavigationIntent("replace", routes.home);
      router.replace(routes.home);
    });
  }

  return { enterHome, isPending };
}
