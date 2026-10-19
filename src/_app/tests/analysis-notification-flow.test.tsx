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
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import {
  useRegisteredAnalyses,
  type ImageAnalysisListItem,
} from "@/entities/image";
import { notificationQueries } from "@/entities/notification";
import { NotificationStream } from "@/widgets/notification-stream";
import { AnalysisTaskBanner } from "@/widgets/route-header";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/entities/refrigerator", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCurrentRefrigeratorId: () => "17",
}));
vi.mock("@/entities/notification", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotificationSessionScope: () => "session",
}));
vi.mock("@/widgets/route-header/ui/route-header", () => ({
  RouteHeader: () => null,
}));
vi.mock("@lineiconshq/free-icons", () => ({
  ArrowRightOutlined: {},
  HourglassOutlined: {},
  CheckCircle1Outlined: {},
  XmarkCircleOutlined: {},
  XmarkOutlined: {},
}));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));
vi.mock("@/shared/ui/app-link", () => ({
  AppLink: ({ href, children }: { href: string; children: ReactNode }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        navigation.pathname = new URL(href, "http://localhost").pathname;
      }}
    >
      {children}
    </a>
  ),
}));

class Stream extends EventTarget {
  static CLOSED = 2;
  static instances: Stream[] = [];
  readyState = 1;
  onerror: ((event: Event) => void) | null = null;
  constructor(readonly url: string) {
    super();
    Stream.instances.push(this);
  }
  close() {
    this.readyState = Stream.CLOSED;
  }
  emit(type: string, data: object = {}) {
    this.dispatchEvent(new MessageEvent(type, { data: JSON.stringify(data) }));
  }
}

const initialJob: ImageAnalysisListItem = {
  analysisId: "job-1",
  status: "PROCESSING",
  submittedAt: "2026-10-16T10:00:00Z",
  expiresAt: null,
  pollAfterMs: null,
  totalImageCount: 3,
  completedImageCount: 0,
  failedImageCount: 0,
  images: [],
  error: null,
};
let job: ImageAnalysisListItem;
let unreadCount: number;
let serverHasJob: boolean;
let queryClient: QueryClient;
const fetchMock = vi.fn();

beforeEach(() => {
  navigation.pathname = "/";
  Stream.instances = [];
  job = { ...initialJob };
  unreadCount = 0;
  serverHasJob = true;
  useRegisteredAnalyses.setState({ idsBySession: {} });
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  fetchMock.mockReset().mockImplementation(async (url: string) => {
    let data: unknown;
    if (url === "/api/v1/image-analyses")
      data = { analyses: serverHasJob ? [job] : [] };
    else if (url.endsWith("/unread-count"))
      data = { refrigeratorId: "17", unreadCount };
    else if (url.includes("/notifications?"))
      data = {
        notifications: unreadCount
          ? [{ notificationId: "new-1", readAt: null }]
          : [],
        expiredIngredientsNum: 0,
        nextCursor: null,
        hasNext: false,
      };
    else throw new Error(`Unexpected request: ${url}`);
    return Response.json({ code: "TEST-200-001", message: "성공", data });
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("EventSource", Stream);
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationStream />
      <AnalysisTaskBanner />
    </QueryClientProvider>
  );
}

it("홈에서 이미지별 성공·실패와 전체 완료를 SSE → 목록 재조회 → 배너 순서로 반영한다", async () => {
  render(<App />);
  await screen.findByText("영수증 인식 중 · 0/3장");
  const source = Stream.instances[0];
  for (const counts of [
    { completedImageCount: 1, failedImageCount: 0 },
    { completedImageCount: 1, failedImageCount: 1 },
  ]) {
    job = { ...job, ...counts };
    act(() =>
      source.emit("image-analysis.image-finished", {
        analysisId: job.analysisId,
        imageObjectKey: "receipt.jpg",
        imageStatus: counts.failedImageCount ? "FAILED" : "COMPLETED",
        totalImageCount: 3,
        ...counts,
        expiresAt: null,
      }),
    );
    await screen.findByText(
      `영수증 인식 중 · ${counts.completedImageCount + counts.failedImageCount}/3장`,
    );
  }
  job = { ...job, status: "PARTIALLY_COMPLETED", completedImageCount: 2 };
  act(() => source.emit("image-analysis.finished", job));
  await screen.findByText("일부 인식 완료 · 결과 확인");
  expect(Stream.instances).toHaveLength(1);
  expect(
    fetchMock.mock.calls.every(([url]) => url === "/api/v1/image-analyses"),
  ).toBe(true);
});

it("배너는 결과 링크를 제공하고 결과 확인 뒤 홈으로 돌아와도 유지하며 새 QueryClient에서도 목록으로 복원한다", async () => {
  job = { ...job, status: "COMPLETED" };
  const view = render(<App />);
  const link = await screen.findByRole("link");
  expect(link.getAttribute("href")).toBe(
    "/refrigerator/register/receipt/result?analysisId=job-1",
  );
  fireEvent.click(link);
  view.rerender(<App />);
  expect(screen.queryByRole("status")).toBeNull();
  navigation.pathname = "/";
  view.rerender(<App />);
  expect(screen.getByText("인식 완료 · 결과 확인")).toBeTruthy();
  view.unmount();
  queryClient.clear();
  queryClient = new QueryClient();
  render(<App />);
  await screen.findByText("인식 완료 · 결과 확인");
  const before = fetchMock.mock.calls.length;
  act(() => Stream.instances.at(-1)!.emit("connected"));
  await waitFor(() =>
    expect(fetchMock.mock.calls.length).toBeGreaterThan(before),
  );
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  expect(screen.getByText("인식 완료 · 결과 확인")).toBeTruthy();
});

it("일반 알림은 목록·미읽음 수를 갱신하고 분석 이벤트는 두 캐시와 알림 API를 건드리지 않는다", async () => {
  render(<App />);
  await screen.findByText("영수증 인식 중 · 0/3장");
  fetchMock.mockClear();
  unreadCount = 2;
  const source = Stream.instances[0];
  act(() => source.emit("notifications-changed", { refrigeratorId: "17" }));
  const countKey = notificationQueries.unreadCount("session", "17").queryKey;
  const listKey = notificationQueries.list("session", "17", "ALL").queryKey;
  await waitFor(() =>
    expect(queryClient.getQueryData(countKey)).toEqual({
      refrigeratorId: "17",
      unreadCount: 2,
    }),
  );
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  expect(fetchMock.mock.calls.map(([url]) => url).sort()).toEqual(
    [
      "/api/v1/refrigerators/17/notifications?type=ALL",
      "/api/v1/refrigerators/17/notifications/unread-count",
    ].sort(),
  );
  const previousList = queryClient.getQueryData(listKey);
  expect(previousList).toMatchObject({
    pages: [{ notifications: [{ notificationId: "new-1" }] }],
  });
  fetchMock.mockClear();
  job = { ...job, completedImageCount: 1 };
  act(() =>
    source.emit("image-analysis.image-finished", { analysisId: "job-1" }),
  );
  await screen.findByText("영수증 인식 중 · 1/3장");
  expect(queryClient.getQueryData(countKey)).toEqual({
    refrigeratorId: "17",
    unreadCount: 2,
  });
  expect(queryClient.getQueryData(listKey)).toBe(previousList);
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    "/api/v1/image-analyses",
  ]);
});

it.each([
  { status: "COMPLETED", text: "인식 완료 · 결과 확인" },
  { status: "PARTIALLY_COMPLETED", text: "일부 인식 완료 · 결과 확인" },
  { status: "FAILED", text: "인식 실패 · 결과 확인" },
] as const)(
  "전체 종료 $status 이벤트 뒤 서버 상태를 배너에 표시한다",
  async ({ status, text }) => {
    render(<App />);
    await screen.findByText("영수증 인식 중 · 0/3장");
    job = { ...job, status };
    act(() =>
      Stream.instances[0].emit("image-analysis.finished", {
        analysisId: job.analysisId,
        status,
      }),
    );
    await screen.findByText(text);
  },
);

it("서버 목록이 등록 완료 작업을 제외하면 새로고침으로 메모리 상태를 비워도 배너가 다시 나오지 않는다", async () => {
  const view = render(<App />);
  await screen.findByText("영수증 인식 중 · 0/3장");
  act(() =>
    useRegisteredAnalyses.getState().markRegistered("session", "job-1"),
  );
  expect(screen.queryByRole("status")).toBeNull();
  view.unmount();
  queryClient.clear();
  queryClient = new QueryClient();
  useRegisteredAnalyses.setState({ idsBySession: {} });
  serverHasJob = false;
  fetchMock.mockClear();
  render(<App />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  expect(screen.queryByRole("status")).toBeNull();
});

it("놓친 분석 이벤트가 있어도 재접속·화면 복귀 때 서버 최신 결과로 배너를 복구한다", async () => {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  render(<App />);
  await screen.findByText("영수증 인식 중 · 0/3장");
  job = { ...job, completedImageCount: 2 };
  act(() => Stream.instances[0].emit("connected"));
  await screen.findByText("영수증 인식 중 · 2/3장");
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  job = { ...job, status: "COMPLETED", completedImageCount: 3 };
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  await screen.findByText("인식 완료 · 결과 확인");
});

it("서버가 등록한 작업을 계속 반환하면 메모리 초기화 뒤 배너가 재노출되는 한계를 확인한다", async () => {
  job = { ...job, status: "COMPLETED" };
  const view = render(<App />);
  await screen.findByText("인식 완료 · 결과 확인");
  act(() =>
    useRegisteredAnalyses.getState().markRegistered("session", "job-1"),
  );
  expect(screen.queryByRole("status")).toBeNull();
  view.unmount();
  queryClient.clear();
  queryClient = new QueryClient();
  useRegisteredAnalyses.setState({ idsBySession: {} });
  render(<App />);
  await screen.findByText("인식 완료 · 결과 확인");
});
