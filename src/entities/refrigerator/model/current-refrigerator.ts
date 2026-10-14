import { useQuery } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";

import { SessionExpiredError } from "@/shared/api";

import { refrigeratorQueries } from "../api/refrigerator.queries";
import { CURRENT_REFRIGERATOR_COOKIE_NAME } from "./current-refrigerator-cookie";

const CHANGE_EVENT = "dameokja:current-refrigerator-change";
const LEGACY_STORAGE_KEY = "dameokja.currentRefrigeratorId";

function writeCookie(refrigeratorId: string | null): void {
  const value = refrigeratorId ? encodeURIComponent(refrigeratorId) : "";
  const maxAge = refrigeratorId ? 60 * 60 * 24 * 365 : 0;
  document.cookie = `${CURRENT_REFRIGERATOR_COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
}

function readCookie(): string | null {
  const prefix = `${CURRENT_REFRIGERATOR_COOKIE_NAME}=`;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
  return value ? decodeURIComponent(value) : null;
}

function readCurrentRefrigeratorId(): string | null {
  return (
    readCookie() ?? (window.localStorage.getItem(LEGACY_STORAGE_KEY) || null)
  );
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
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

  useEffect(() => {
    if (storedId && !readCookie()) setCurrentRefrigeratorId(storedId);
  }, [storedId]);

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
  writeCookie(refrigeratorId);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// 세션 종료용
export function clearCurrentRefrigeratorId(): void {
  writeCookie(null);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}
