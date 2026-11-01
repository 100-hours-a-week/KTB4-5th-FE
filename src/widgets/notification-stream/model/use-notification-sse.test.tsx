// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { ApiError, SessionExpiredError } from "@/shared/api";

import { useNotificationSse } from "./use-notification-sse";

const { refresh, session, recover } = vi.hoisted(() => ({
  recover: vi.fn(),
  session: { loggingOut: false },
  refresh: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/features/recover-refrigerator-access", () => ({
  useRecoverRefrigeratorAccess: () => recover,
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
vi.mock("@/shared/api", () => ({
  ApiError: class extends Error {
    constructor(readonly status: number) {
      super();
    }
  },
  SessionExpiredError: class extends Error {},
  isIntentionalLogout: () => session.loggingOut,
}));

vi.mock("@/entities/image", () => ({
  imageAnalysisQueries: {
    all: () => ["image-analyses"],
    list: (scope: string) => ({ queryKey: ["image-analyses", "list", scope] }),
    detail: (id: string) => ({ queryKey: ["image-analyses", id] }),
  },
}));

vi.mock("@/entities/recommendation", () => ({
  recommendationQueries: {
    list: (id: string) => ({
      queryKey: ["refrigerators", id, "recommendations"],
    }),
  },
}));
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
  recover.mockClear();
  session.loggingOut = false;
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.stubGlobal("EventSource", FakeEventSource);
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  queryClient.clear();
  vi.restoreAllMocks();
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

it("연결 오류에서 REST로 인증을 확인하고 닫힌 연결을 다시 연다", async () => {
  vi.spyOn(Math, "random").mockReturnValue(0);
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

it("OCR image/whole-job events refresh results and list without opening another stream", () => {
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const { unmount } = renderHook(() => useNotificationSse("user", "17"), {
    wrapper,
  });
  const source = FakeEventSource.instances[0];
  act(() =>
    source.emit("image-analysis.image-finished", '{"analysisId":"job-1"}'),
  );
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: ["image-analyses", "list", "user"],
  });
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: ["image-analyses", "job-1"],
  });
  invalidate.mockClear();
  act(() => source.emit("image-analysis.finished", '{"analysisId":"job-1"}'));
  expect(invalidate).toHaveBeenCalledTimes(2);
  expect(FakeEventSource.instances).toHaveLength(1);
  expect(refresh).not.toHaveBeenCalled();
  invalidate.mockClear();
  act(() => source.emit("image-analysis.finished", "null"));
  act(() => source.emit("image-analysis.finished", '{"analysisId":4}'));
  act(() => source.emit("image-analysis.finished", "invalid"));
  expect(invalidate).not.toHaveBeenCalled();
  unmount();
  act(() => source.emit("image-analysis.finished", '{"analysisId":"job-1"}'));
  expect(invalidate).not.toHaveBeenCalled();
});

it("reconciles both active list and detail caches on connect and foreground recovery", () => {
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const { unmount } = renderHook(() => useNotificationSse("user", "17"), {
    wrapper,
  });
  act(() => FakeEventSource.instances[0].emit("connected", "{}"));
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["image-analyses"] });
  invalidate.mockClear();
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["image-analyses"] });
  unmount();
});

it("숨김 상태에서는 알림 요청을 취소하고 화면 복귀 시 닫힌 연결과 데이터를 복구한다", () => {
  const cancel = vi.spyOn(queryClient, "cancelQueries");
  const { unmount } = renderHook(() => useNotificationSse("user", "17"), {
    wrapper,
  });
  const source = FakeEventSource.instances[0];
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(cancel).toHaveBeenCalledWith({
    queryKey: ["notifications", "user", "17"],
  });
  expect(refresh).not.toHaveBeenCalled();
  source.close();
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(FakeEventSource.instances).toHaveLength(2);
  expect(refresh).toHaveBeenCalledWith(queryClient, "user", "17");
  unmount();
});

it("잘못된 알림·분석 메시지와 알 수 없는 이벤트는 무시한다", () => {
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  renderHook(() => useNotificationSse("user", "17"), { wrapper });
  const source = FakeEventSource.instances[0];
  for (const data of ["invalid", "null", "{}", '{"refrigeratorId":17}']) {
    act(() => source.emit("notifications-changed", data));
  }
  for (const type of [
    "image-analysis.image-finished",
    "image-analysis.finished",
  ]) {
    for (const data of [
      "invalid",
      "null",
      "[]",
      "{}",
      '{"analysisId":""}',
      '{"analysisId":4}',
    ]) {
      act(() => source.emit(type, data));
    }
  }
  act(() => source.emit("unknown-event", '{"analysisId":"job-1"}'));
  expect(refresh).not.toHaveBeenCalled();
  expect(invalidate).not.toHaveBeenCalled();
});

it("이전 냉장고 연결과 언마운트 후 도착한 이벤트·오류·화면 복귀를 무시한다", () => {
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const fetch = vi.spyOn(queryClient, "fetchQuery");
  const { rerender, unmount } = renderHook(
    ({ id }) => useNotificationSse("user", id),
    { wrapper, initialProps: { id: "17" } },
  );
  const previous = FakeEventSource.instances[0];
  rerender({ id: "18" });
  function sendLateEvents(source: FakeEventSource) {
    source.emit("connected");
    source.emit("kicked", "{}");
    source.emit("notifications-changed", '{"refrigeratorId":"17"}');
    source.emit("image-analysis.image-finished", '{"analysisId":"job-1"}');
    source.emit("image-analysis.finished", '{"analysisId":"job-1"}');
    source.onerror?.(new Event("error"));
  }
  act(() => sendLateEvents(previous));
  unmount();
  act(() => {
    sendLateEvents(FakeEventSource.instances[1]);
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(refresh).not.toHaveBeenCalled();
  expect(invalidate).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
  expect(recover).not.toHaveBeenCalled();
  expect(FakeEventSource.instances).toHaveLength(2);
});

it("kicked는 연결을 닫고 한 번만 복구하며 이후 이벤트·foreground·online을 무시한다", () => {
  renderHook(() => useNotificationSse("user", "17"), { wrapper });
  const source = FakeEventSource.instances[0];
  for (const data of ["invalid", "null", "[]"]) {
    act(() => source.emit("kicked", data));
  }
  expect(recover).not.toHaveBeenCalled();
  act(() => source.emit("kicked", "{}"));
  expect(source.readyState).toBe(FakeEventSource.CLOSED);
  expect(recover).toHaveBeenCalledTimes(1);
  act(() => {
    source.emit("kicked", "{}");
    source.emit("connected", "{}");
    source.emit("notifications-changed", '{"refrigeratorId":"17"}');
    source.onerror?.(new Event("error"));
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("online"));
  });
  expect(recover).toHaveBeenCalledTimes(1);
  expect(refresh).not.toHaveBeenCalled();
  expect(FakeEventSource.instances).toHaveLength(1);
});

it("브라우저가 스스로 재연결 중인 오류에서는 REST 인증 확인도 새 연결도 만들지 않는다", async () => {
  const fetch = vi.spyOn(queryClient, "fetchQuery");
  renderHook(() => useNotificationSse("user", "17"), { wrapper });
  const source = FakeEventSource.instances[0];
  act(() => {
    source.onerror?.(new Event("error"));
    source.onerror?.(new Event("error"));
  });
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  expect(fetch).not.toHaveBeenCalled();
  expect(FakeEventSource.instances).toHaveLength(1);
});

it("인증 조회 실패나 의도한 로그아웃에서는 닫힌 연결을 다시 열지 않는다", async () => {
  const fetch = vi
    .spyOn(queryClient, "fetchQuery")
    .mockRejectedValue(new SessionExpiredError());
  const { unmount } = renderHook(() => useNotificationSse("user", "17"), {
    wrapper,
  });
  const source = FakeEventSource.instances[0];
  source.close();
  await act(async () => source.onerror?.(new Event("error")));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(FakeEventSource.instances).toHaveLength(1);
  unmount();
  session.loggingOut = true;
  renderHook(() => useNotificationSse("user", "17"), { wrapper });
  const loggingOutSource = FakeEventSource.instances[1];
  act(() => loggingOutSource.onerror?.(new Event("error")));
  expect(loggingOutSource.readyState).toBe(FakeEventSource.CLOSED);
  expect(fetch).toHaveBeenCalledTimes(1);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(FakeEventSource.instances).toHaveLength(2);
});

async function advance(ms: number) {
  await act(() => vi.advanceTimersByTimeAsync(ms));
}

async function failClosed(source: FakeEventSource) {
  source.close();
  source.onerror?.(new Event("error"));
  await advance(0);
}

it("서버 오류로 닫힌 연결은 간격을 두 배씩 늘려 다시 열고 connected에서 간격을 되돌린다", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  vi.spyOn(queryClient, "fetchQuery").mockRejectedValue(
    new ApiError(503, { code: "GLOBAL-503-001", title: "", status: 503 }),
  );
  renderHook(() => useNotificationSse("user", "17"), { wrapper });

  await failClosed(FakeEventSource.instances[0]);
  await advance(999);
  expect(FakeEventSource.instances).toHaveLength(1);
  await advance(1);
  expect(FakeEventSource.instances).toHaveLength(2);

  await failClosed(FakeEventSource.instances[1]);
  await advance(1999);
  expect(FakeEventSource.instances).toHaveLength(2);
  await advance(1);
  expect(FakeEventSource.instances).toHaveLength(3);

  act(() => FakeEventSource.instances[2].emit("connected", "{}"));
  await failClosed(FakeEventSource.instances[2]);
  await advance(1000);
  expect(FakeEventSource.instances).toHaveLength(4);
});

it("냉장고 접근 불가 같은 4xx 응답에서는 다시 연결하지 않는다", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  vi.spyOn(queryClient, "fetchQuery").mockRejectedValue(
    new ApiError(410, { code: "REFRIGERATOR-410-001", title: "", status: 410 }),
  );
  renderHook(() => useNotificationSse("user", "17"), { wrapper });

  await failClosed(FakeEventSource.instances[0]);
  await advance(60_000);
  expect(FakeEventSource.instances).toHaveLength(1);
});

it("online 이벤트에서 닫힌 연결만 바로 다시 열고 예약된 재시도는 취소한다", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  vi.spyOn(queryClient, "fetchQuery").mockRejectedValue(
    new ApiError(503, { code: "GLOBAL-503-001", title: "", status: 503 }),
  );
  renderHook(() => useNotificationSse("user", "17"), { wrapper });

  act(() => window.dispatchEvent(new Event("online")));
  expect(FakeEventSource.instances).toHaveLength(1);

  await failClosed(FakeEventSource.instances[0]);
  act(() => window.dispatchEvent(new Event("online")));
  expect(FakeEventSource.instances).toHaveLength(2);
  await advance(30_000);
  expect(FakeEventSource.instances).toHaveLength(2);
});
