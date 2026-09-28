"use client";

import { useEffect, useState } from "react";

// 이보다 빨리 끝나는 조회는 로딩 화면 없이 바로 목록을 보여 준다.
const LOADING_DELAY_MS = 300;
// 로딩 화면을 띄웠다면 이미지를 알아볼 수 있을 만큼 유지한다.
const LOADING_MIN_VISIBLE_MS = 800;

type DeferredLoading = {
  isLoadingVisible: boolean;
  isLoadingDeferred: boolean;
};

export function useDeferredLoading(isLoading: boolean): DeferredLoading {
  const [visibleSince, setVisibleSince] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(
      () => setVisibleSince(Date.now()),
      LOADING_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (isLoading || visibleSince === null) return;

    const remaining = LOADING_MIN_VISIBLE_MS - (Date.now() - visibleSince);
    const timer = setTimeout(
      () => setVisibleSince(null),
      Math.max(remaining, 0),
    );
    return () => clearTimeout(timer);
  }, [isLoading, visibleSince]);

  const isLoadingVisible = visibleSince !== null;

  return {
    isLoadingVisible,
    isLoadingDeferred: isLoading && !isLoadingVisible,
  };
}
