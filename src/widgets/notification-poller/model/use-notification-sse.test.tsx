// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { useNotificationSse } from "./use-notification-sse";

const { refresh } = vi.hoisted(() => ({
  refresh: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/entities/notification", () => ({
  getNotificationEventsUrl: (id: string) =>
    `/api/v2/refrigerators/${id}/notifications/stream`,
  notificationQueries: {
    byRefrigerator: (user: string, id: string) => ["notifications", user, id],
    unreadCount: (user: string, id: string) => ({
      queryKey: ["notifications", user, id, "unread-count"],
      queryFn: () => Promise.resolve({ refrigeratorId: id, unreadCount: 0 }),
    }),
  },
  refreshNotificationQueries: refresh,
}));
vi.mock("@/shared/api", () => ({ isIntentionalLogout: () => false }));

class FakeEventSource {
  static CLOSED = 2;
  static instances: FakeEventSource[] = [];

  readyState = 0;
  onerror: ((event: Event) => void) | null = null;
  private listeners = new Map<string, Array<(event: MessageEvent) => void>>();

  constructor(
    readonly url: string,
    readonly options: EventSourceInit,
  ) {
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  emit(type: string, data = "") {
    this.listeners
      .get(type)
      ?.forEach((listener) => listener(new MessageEvent(type, { data })));
  }

  close() {
    this.readyState = FakeEventSource.CLOSED;
  }
}

let queryClient: QueryClient;

beforeEach(() => {
  FakeEventSource.instances = [];
  refresh.mockClear();
  vi.stubGlobal("EventSource", FakeEventSource);
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
});

afterEach(() => {
  queryClient.clear();
  vi.unstubAllGlobals();
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

it("연결·현재 냉장고 변경 신호·foreground에서 재조회하고 종료 시 연결을 닫는다", () => {
  const { unmount } = renderHook(() => useNotificationSse("user", "17"), {
    wrapper,
  });
  const source = FakeEventSource.instances[0];
  expect(source.url).toBe("/api/v2/refrigerators/17/notifications/stream");
  expect(source.options.withCredentials).toBe(true);

  act(() => source.emit("connected", "{}"));
  expect(refresh).toHaveBeenCalledTimes(1);

  act(() => source.emit("notifications-changed", '{"refrigeratorId":"18"}'));
  expect(refresh).toHaveBeenCalledTimes(1);
  act(() => source.emit("notifications-changed", '{"refrigeratorId":"17"}'));
  expect(refresh).toHaveBeenCalledTimes(2);

  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(refresh).toHaveBeenCalledTimes(3);

  unmount();
  expect(source.readyState).toBe(FakeEventSource.CLOSED);
});

it("연결 오류에서 REST로 인증을 확인하고 닫힌 연결은 한 번 다시 연다", async () => {
  const { unmount } = renderHook(() => useNotificationSse("user", "17"), {
    wrapper,
  });
  const source = FakeEventSource.instances[0];

  act(() => {
    source.close();
    source.onerror?.(new Event("error"));
  });
  await waitFor(() => expect(FakeEventSource.instances).toHaveLength(2));

  act(() => FakeEventSource.instances[1].emit("connected", "{}"));
  unmount();
  expect(FakeEventSource.instances[1].readyState).toBe(FakeEventSource.CLOSED);
});

it("활성 냉장고가 바뀌면 이전 연결을 닫고 새 냉장고에 연결한다", () => {
  const { rerender, unmount } = renderHook(
    ({ refrigeratorId }) => useNotificationSse("user", refrigeratorId),
    { wrapper, initialProps: { refrigeratorId: "17" } },
  );
  const previous = FakeEventSource.instances[0];

  rerender({ refrigeratorId: "18" });
  expect(previous.readyState).toBe(FakeEventSource.CLOSED);
  expect(FakeEventSource.instances[1].url).toContain("/refrigerators/18/");

  act(() => FakeEventSource.instances[1].emit("connected", "{}"));
  expect(refresh).toHaveBeenCalledWith(queryClient, "user", "18");
  unmount();
});
