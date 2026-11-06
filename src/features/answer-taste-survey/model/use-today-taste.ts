"use client";

import { useMemo, useSyncExternalStore } from "react";

const COOKIE_NAME = "todayTaste";
const CHANGE_EVENT = "dameokja:today-taste-change";
const HOUR_MS = 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * HOUR_MS;
const RESET_HOUR_KST = 8;

function getNextTasteResetAt(now = Date.now()): Date {
  const kstDayStart =
    Math.floor((now + KST_OFFSET_MS) / (24 * HOUR_MS)) * 24 * HOUR_MS;
  const resetAt = kstDayStart - KST_OFFSET_MS + RESET_HOUR_KST * HOUR_MS;
  return new Date(resetAt > now ? resetAt : resetAt + 24 * HOUR_MS);
}

function readCookie(): string | null {
  const prefix = `${COOKIE_NAME}=`;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
  return value === undefined ? null : decodeURIComponent(value);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function writeCookie(value: string, expires: Date): void {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; path=/; expires=${expires.toUTCString()}; samesite=lax`;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setTodayTaste(
  refrigeratorId: string,
  optionIds: string[],
): void {
  writeCookie(
    `${refrigeratorId}|${optionIds.join(",")}`,
    getNextTasteResetAt(),
  );
}

export function clearTodayTaste(): void {
  if (readCookie() !== null) writeCookie("", new Date(0));
}

export function useTodayTaste(
  refrigeratorId: string | null | undefined,
): string[] | null | undefined {
  const value = useSyncExternalStore(subscribe, readCookie, () => undefined);
  return useMemo(() => {
    if (value === undefined || refrigeratorId === undefined) return undefined;
    if (value === null || refrigeratorId === null) return null;
    const [ownerId, optionIds = ""] = value.split("|");
    return ownerId === refrigeratorId
      ? optionIds.split(",").filter(Boolean)
      : null;
  }, [value, refrigeratorId]);
}
