import { useQuery } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";

import { SessionExpiredError } from "@/shared/api";

import { refrigeratorQueries } from "../api/refrigerator.queries";

const STORAGE_KEY = "dameokja.currentRefrigeratorId";
const CHANGE_EVENT = "dameokja:current-refrigerator-change";

function readCurrentRefrigeratorId(): string | null {
  return window.localStorage.getItem(STORAGE_KEY) || null;
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

// undefined: 확인 중, null: 활성 냉장고 없음
export function useCurrentRefrigeratorId(): string | null | undefined {
  return useCurrentRefrigeratorRecovery().refrigeratorId;
}

export function useCurrentRefrigeratorRecovery() {
  const storedId = useSyncExternalStore(
    subscribe,
    readCurrentRefrigeratorId,
    () => undefined,
  );
  // 저장값이 지워진 세션은 현재 냉장고 조회로 복구한다.
  const { data, error, refetch } = useQuery({
    ...refrigeratorQueries.current(),
    enabled: storedId === null,
  });
  const recoveredId =
    storedId === null && data ? (data[0]?.refrigeratorId ?? null) : undefined;

  useEffect(() => {
    if (recoveredId) setCurrentRefrigeratorId(recoveredId);
  }, [recoveredId]);

  return {
    refrigeratorId: storedId ?? recoveredId,
    // 세션 만료는 로그인 화면으로 보내므로 복구 실패로 보지 않는다.
    isRecoveryError:
      storedId === null &&
      !data &&
      Boolean(error) &&
      !(error instanceof SessionExpiredError),
    retryRecovery: () => void refetch(),
  };
}

export function setCurrentRefrigeratorId(refrigeratorId: string | null): void {
  if (refrigeratorId) {
    window.localStorage.setItem(STORAGE_KEY, refrigeratorId);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// 세션 종료용
export function clearCurrentRefrigeratorId(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
