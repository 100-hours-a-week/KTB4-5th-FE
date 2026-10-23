// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  refrigeratorQueries,
  type MypageOverview,
} from "@/entities/refrigerator";
import { NotificationSettingsPage } from "./notification-settings-page";

vi.mock("@lineiconshq/free-icons", () => ({ Bell1Outlined: {} }));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));

const push = vi.hoisted(() => ({
  status: "off",
  isPending: false,
  isGuideOpen: false,
  isPermissionGuideOpen: false,
  closeGuide: vi.fn(),
  closePermissionGuide: vi.fn(),
  handleClick: vi.fn(),
}));
vi.mock("@/entities/notification", async () => ({
  ...(await vi.importActual("@/entities/notification")),
  useNotificationSessionScope: () => "qa",
}));
vi.mock("@/features/manage-push-notifications", async () => ({
  ...(await import("@/features/manage-push-notifications/api/update-notification-preference")),
  usePushNotificationSetting: () => push,
  PushInstallGuideSheet: () => null,
  PushPermissionGuideSheet: () => null,
}));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("설정 저장은 모든 냉장고의 마이페이지 캐시를 즉시 갱신하고 기기 수신은 기존 구독 기능으로 연결한다", async () => {
  document.cookie = "XSRF-TOKEN=qa; path=/";
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const preferences = [{ type: "EXPIRATION", isEnabled: true }];
  for (const id of ["17", "18"])
    client.setQueryData(refrigeratorQueries.mypage(id).queryKey, {
      nickname: "QA",
      userId: "1",
      email: null,
      profileImageUrl: null,
      refrigeratorId: id,
      refrigeratorName: "QA",
      ingredientsNum: 1,
      expiredIngredientsNum: 0,
      memberNum: 2,
      notificationPreferences: preferences,
    });
  const fetchMock = vi.fn(async (_url: string, init: RequestInit = {}) =>
    Response.json({
      code: "OK",
      message: "",
      data: {
        notificationPreferences: [
          { type: "EXPIRATION", isEnabled: init.method !== "PATCH" },
        ],
      },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  render(
    <QueryClientProvider client={client}>
      <NotificationSettingsPage />
    </QueryClientProvider>,
  );
  const toggle = await screen.findByRole("switch", { name: /임박·만료 알림/ });
  fireEvent.click(toggle);
  await waitFor(() => {
    for (const id of ["17", "18"])
      expect(
        client.getQueryData<MypageOverview>(
          refrigeratorQueries.mypage(id).queryKey,
        )?.notificationPreferences,
      ).toEqual([{ type: "EXPIRATION", isEnabled: false }]);
  });
  fireEvent.click(screen.getByRole("switch", { name: /이 기기 푸시 수신/ }));
  expect(push.handleClick).toHaveBeenCalledOnce();
  expect(
    fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH"),
  ).toHaveLength(1);
  client.clear();
});
