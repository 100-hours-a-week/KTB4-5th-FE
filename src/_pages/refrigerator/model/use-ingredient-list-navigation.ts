"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import {
  toIngredientListQueryString,
  type IngredientListQuery,
} from "@/entities/ingredient";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";

// TODO: 스크롤 위치 기억, URL에서 파생되는 Query Key 확인
export function useIngredientListNavigation(query: IngredientListQuery) {
  const router = useRouter();

  // 필터·정렬 변경을 URL 변경으로 연결
  return useCallback(
    (patch: Partial<IngredientListQuery>) => {
      const queryString = toIngredientListQueryString({ ...query, ...patch }); // 변경할 값만 patch로 전달해서 필터를 옮겨도 정렬 유지시킴
      const href = queryString
        ? `${routes.refrigerator}?${queryString}`
        : routes.refrigerator;

      markAppNavigationIntent("replace", href);
      router.replace(href, { scroll: false });
    },
    [query, router],
  );
}
