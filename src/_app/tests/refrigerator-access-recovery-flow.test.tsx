// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useEffect } from "react";

import { CurrentRefrigeratorGate } from "@/_app/providers/current-refrigerator-gate";
import { useNotificationSessionScope } from "@/entities/notification";
import {
  refrigeratorQueries,
  setCurrentRefrigeratorId,
  useCurrentRefrigeratorId,
} from "@/entities/refrigerator";
import {
  ApiError,
  clearIntentionalLogout,
  markIntentionalLogout,
} from "@/shared/api";
import { NotificationStream } from "@/widgets/notification-stream";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@lineiconshq/free-icons", () => ({ Bell1Outlined: {} }));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));

class FakeEventSource extends EventTarget {
  static CLOSED = 2;
  static instances: FakeEventSource[] = [];
  readyState = 1;
  onerror: ((event: Event) => void) | null = null;
  constructor(readonly url: string) {
    super();
    FakeEventSource.instances.push(this);
  }
  close() {
    this.readyState = FakeEventSource.CLOSED;
  }
  emit(type: string) {
    this.dispatchEvent(new MessageEvent(type, { data: "{}" }));
  }
}

let client: QueryClient;
let finishCurrent: (response: Response) => void;
let fetchMock: ReturnType<typeof vi.fn>;
let userScope: string | undefined;

function json(data: unknown) {
  return Response.json({ code: "SUCCESS", message: "", data });
}

function CurrentScreen() {
  const id = useCurrentRefrigeratorId();
  const scope = useNotificationSessionScope();
  useEffect(() => {
    userScope = scope;
  }, [scope]);
  return <div>냉장고 화면 {id}</div>;
}

function renderFlow() {
  return render(
    <QueryClientProvider client={client}>
      <NotificationStream />
      <CurrentRefrigeratorGate>
        <CurrentScreen />
      </CurrentRefrigeratorGate>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  FakeEventSource.instances = [];
  router.replace.mockClear();
  clearIntentionalLogout();
  localStorage.clear();
  setCurrentRefrigeratorId("17");
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(refrigeratorQueries.current().queryKey, [
    { refrigeratorId: "17", name: "공유", capacity: 1500, expiredCount: 0 },
  ]);
  fetchMock = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        finishCurrent = resolve;
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("EventSource", FakeEventSource);
});

afterEach(() => {
  cleanup();
  client.clear();
  clearIntentionalLogout();
  setCurrentRefrigeratorId(null);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("kicked 후 공유 화면·캐시·요청을 정리하고 서버의 현재 냉장고로 새 연결한다", async () => {
  const oldIngredients = ["refrigerators", "17", "ingredients", "list"];
  client.setQueryData(oldIngredients, { pages: ["공유 재고"] });
  client.setQueryData(["image-analyses", "job"], { status: "PROCESSING" });
  client.setQueryData(["refrigerators", "99", "members"], ["다른 냉장고"]);
  let signal: AbortSignal | undefined;
  const pending = client
    .fetchQuery({
      queryKey: ["refrigerators", "17", "members"],
      queryFn: (context) => {
        signal = context.signal;
        return new Promise(() => {});
      },
    })
    .catch(() => {});
  const view = renderFlow();
  const oldNotifications = ["notifications", userScope, "17", "unread-count"];
  client.setQueryData(oldNotifications, { unreadCount: 5 });
  expect(screen.getByText("냉장고 화면 17")).toBeTruthy();
  const source = FakeEventSource.instances[0];
  act(() => {
    source.emit("kicked");
    source.emit("kicked");
  });
  expect(source.readyState).toBe(FakeEventSource.CLOSED);
  expect(screen.queryByText("냉장고 화면 17")).toBeNull();
  expect(screen.getByText("냉장고 정보를 불러오는 중입니다")).toBeTruthy();
  expect(signal?.aborted).toBe(true);
  await pending;
  expect(client.getQueryData(oldIngredients)).toBeUndefined();
  expect(client.getQueryData(oldNotifications)).toBeUndefined();
  expect(client.getQueryData(["image-analyses", "job"])).toBeTruthy();
  expect(client.getQueryData(["refrigerators", "99", "members"])).toBeTruthy();
  expect(router.replace).toHaveBeenCalledExactlyOnceWith("/");
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/refrigerators/current");
  await act(async () =>
    finishCurrent(
      json([
        { refrigeratorId: 7, name: "개인", capacity: 1500, expiredCount: 0 },
      ]),
    ),
  );
  await waitFor(() => expect(screen.getByText("냉장고 화면 7")).toBeTruthy());
  expect(document.cookie).toContain("currentRefrigeratorId=7");
  expect(FakeEventSource.instances).toHaveLength(2);
  expect(FakeEventSource.instances[1].url).toContain("/refrigerators/7/");
  view.unmount();
});

it.each(["query", "mutation", "notification"])(
  "kicked 유실 시 %s의 REFRIGERATOR-403-001로 복구한다",
  async (kind) => {
    renderFlow();
    const error = new ApiError(403, {
      code: "REFRIGERATOR-403-001",
      title: "접근 불가",
    });
    await act(async () => {
      if (kind !== "mutation") {
        await client
          .fetchQuery({
            queryKey:
              kind === "query"
                ? ["refrigerators", "17", "members"]
                : ["notifications", userScope, "17", "unread-count"],
            queryFn: () => Promise.reject(error),
          })
          .catch(() => {});
      } else {
        await client
          .getMutationCache()
          .build(client, { mutationFn: () => Promise.reject(error) })
          .execute(undefined)
          .catch(() => {});
      }
    });
    expect(router.replace).toHaveBeenCalledExactlyOnceWith("/");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(FakeEventSource.instances[0].readyState).toBe(
      FakeEventSource.CLOSED,
    );
  },
);

it("다른 냉장고나 다른 403 오류는 복구를 시작하지 않는다", async () => {
  renderFlow();
  await act(async () => {
    for (const [id, code] of [
      ["99", "REFRIGERATOR-403-001"],
      ["17", "OTHER-403-001"],
    ]) {
      await client
        .fetchQuery({
          queryKey: ["refrigerators", id, "members"],
          queryFn: () => Promise.reject(new ApiError(403, { code, title: "" })),
        })
        .catch(() => {});
    }
  });
  expect(router.replace).not.toHaveBeenCalled();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("냉장고 전환 전 시작한 mutation의 늦은 403은 새 냉장고를 초기화하지 않는다", async () => {
  renderFlow();
  let rejectMutation: (error: Error) => void = () => {};
  const mutation = client.getMutationCache().build(client, {
    mutationFn: () =>
      new Promise((_, reject) => {
        rejectMutation = reject;
      }),
  });
  let pending: Promise<unknown>;
  await act(async () => {
    pending = mutation.execute(undefined).catch(() => {});
  });
  act(() => setCurrentRefrigeratorId("18"));
  await act(async () => {
    rejectMutation(
      new ApiError(403, { code: "REFRIGERATOR-403-001", title: "접근 불가" }),
    );
    await pending;
  });
  expect(screen.getByText("냉장고 화면 18")).toBeTruthy();
  expect(router.replace).not.toHaveBeenCalled();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("current 실패 시 공유 화면을 가리고 다시 시도하여 복구한다", async () => {
  renderFlow();
  act(() => FakeEventSource.instances[0].emit("kicked"));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  // query factory의 retry를 포함해 실패 응답을 즉시 반환한다.
  fetchMock.mockResolvedValue(
    Response.json({ code: "GLOBAL-500-001", title: "실패" }, { status: 500 }),
  );
  await act(async () =>
    finishCurrent(
      Response.json({ code: "GLOBAL-500-001", title: "실패" }, { status: 500 }),
    ),
  );
  await waitFor(
    () =>
      expect(screen.getByText("냉장고 정보를 불러오지 못했어요")).toBeTruthy(),
    { timeout: 6000 },
  );
  expect(screen.queryByText("냉장고 화면 17")).toBeNull();
  fetchMock.mockImplementation(() =>
    Promise.resolve(
      json([
        { refrigeratorId: 7, name: "개인", capacity: 1500, expiredCount: 0 },
      ]),
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  await waitFor(() => expect(screen.getByText("냉장고 화면 7")).toBeTruthy());
});

it("로그아웃 중 kicked는 current를 조회하거나 이동하지 않는다", () => {
  renderFlow();
  markIntentionalLogout();
  act(() => FakeEventSource.instances[0].emit("kicked"));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
});

it("알림 갱신 도중 kicked가 오면 이전 목록 조회를 뒤늦게 시작하지 않는다", async () => {
  fetchMock.mockImplementation((url: string) => {
    if (url.endsWith("/current")) {
      return new Promise<Response>((resolve) => {
        finishCurrent = resolve;
      });
    }
    return Promise.resolve(
      json({
        notifications: [],
        hasNext: false,
        nextCursor: null,
        unreadCount: 0,
      }),
    );
  });
  renderFlow();
  await act(async () => {
    FakeEventSource.instances[0].emit("connected");
    FakeEventSource.instances[0].emit("kicked");
  });
  expect(
    fetchMock.mock.calls
      .map(([url]) => url)
      .filter((url: string) => url.includes("notifications?")),
  ).toEqual([]);
  expect(
    client.getQueriesData({ queryKey: ["notifications", userScope, "17"] }),
  ).toEqual([]);
});
