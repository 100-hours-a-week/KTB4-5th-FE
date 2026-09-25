"use client";

import { useSyncExternalStore } from "react";

let sessionScope: string | undefined;
const listeners = new Set<() => void>();

function getSessionScope(): string {
  sessionScope ??= crypto.randomUUID();
  return sessionScope;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// 로그인 응답에 userId가 없어 런타임 세션별로 Query cache를 격리한다.
export function useNotificationSessionScope(): string | undefined {
  return useSyncExternalStore(subscribe, getSessionScope, () => undefined);
}

export function rotateNotificationSessionScope(): void {
  sessionScope = crypto.randomUUID();
  listeners.forEach((listener) => listener());
}
