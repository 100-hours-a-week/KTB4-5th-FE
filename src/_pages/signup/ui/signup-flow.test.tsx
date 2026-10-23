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

import { routes } from "@/shared/routes";
import { useSignupDraftStore } from "../model/use-signup-draft-store";
import { SignupNotificationPage } from "./signup-notification-page";
import { SignupProfilePage } from "./signup-profile-page";
import { SignupTermsPage } from "./signup-terms-page";

const { router, pushSupport, pushPermission, resubscribe, showToast } =
  vi.hoisted(() => ({
    router: { push: vi.fn(), replace: vi.fn() },
    pushSupport: vi.fn(),
    pushPermission: vi.fn(),
    resubscribe: vi.fn(),
    showToast: vi.fn(),
  }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@lineiconshq/free-icons", () => ({ ArrowLeftOutlined: {} }));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));
vi.mock("@/shared/lib/navigation-history", () => ({
  markAppNavigationIntent: vi.fn(),
}));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast: showToast }));
vi.mock("@/entities/notification", () => ({
  rotateNotificationSessionScope: vi.fn(),
}));
vi.mock("@/entities/refrigerator", () => ({
  setCurrentRefrigeratorId: vi.fn(),
}));
vi.mock("@/features/manage-push-notifications", () => ({
  getPushNotificationSupport: pushSupport,
  requestPushPermission: pushPermission,
  resubscribePushNotificationsIfEnabled: resubscribe,
}));

const requiredTerms = { service: true, privacy: true, age: true };
let client: QueryClient;
const fetchMock = vi.fn<typeof fetch>();
const ok = (data: unknown) =>
  Response.json({ code: "USER-200-001", message: "OK", data });

function renderPage(Page: typeof SignupProfilePage) {
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  useSignupDraftStore.getState().reset();
  useSignupDraftStore.setState({
    agreed: requiredTerms,
    nickname: "테스터",
    notificationEnabled: false,
  });
  document.cookie = "XSRF-TOKEN=csrf; path=/";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  pushSupport.mockReturnValue("unsupported");
  pushPermission.mockResolvedValue("granted");
  resubscribe.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  client.clear();
  useSignupDraftStore.getState().reset();
  vi.unstubAllGlobals();
});

it.each([
  ["닉네임 중복", "이미 사용 중이에요"],
  ["금칙어", "사용할 수 없는 단어가 포함돼 있어요"],
  ["닉네임 형식 위반", "닉네임을 다시 확인해 주세요"],
])(
  "HTTP 200이어도 %s이면 오류를 표시하고 다음 단계로 이동하지 않는다",
  async (reason, message) => {
    fetchMock.mockResolvedValue(ok({ valid: false, reason }));
    renderPage(SignupProfilePage);
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    await screen.findByText(message);
    expect(router.push).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "다음" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/users/nickname-validations",
      expect.objectContaining({ body: JSON.stringify({ nickname: "테스터" }) }),
    );
  },
);

it("검증을 통과한 닉네임은 알림 단계로 이동한다", async () => {
  fetchMock.mockResolvedValue(ok({ valid: true, reason: null }));
  renderPage(SignupProfilePage);
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith(routes.signupNotification),
  );
});

it("검증 응답 중 닉네임이 바뀌면 이전 결과로 이동하지 않는다", async () => {
  let resolve!: (response: Response) => void;
  fetchMock.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  renderPage(SignupProfilePage);
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  fireEvent.change(screen.getByRole("textbox", { name: "닉네임" }), {
    target: { value: "새이름" },
  });
  await act(async () => resolve(ok({ valid: true, reason: null })));
  expect(router.push).not.toHaveBeenCalled();
});

it("잘못된 검증 응답으로 다음 단계에 진입하지 않는다", async () => {
  fetchMock.mockResolvedValue(ok({ valid: "false", reason: null }));
  renderPage(SignupProfilePage);
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  await waitFor(() => expect(showToast).toHaveBeenCalled());
  expect(router.push).not.toHaveBeenCalled();
});

it.each([SignupProfilePage, SignupNotificationPage])(
  "필수 약관 미동의 상태로 하위 단계에 직접 진입하면 약관 화면으로 복귀한다",
  async (Page) => {
    useSignupDraftStore.setState({
      agreed: { ...requiredTerms, privacy: false },
    });
    renderPage(Page);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(routes.signup),
    );
    expect(screen.queryByRole("button", { name: /다음|시작하기/ })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushPermission).not.toHaveBeenCalled();
  },
);

it.each([SignupProfilePage, SignupNotificationPage])(
  "새로고침으로 가입 초안이 초기화되면 약관 화면부터 다시 시작한다",
  async (Page) => {
    useSignupDraftStore.getState().reset();
    renderPage(Page);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(routes.signup),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  },
);

it.each([
  { nickname: "" },
  { nickname: "홍길동ㅋ" },
  { nicknameError: "이미 사용 중이에요" },
])("닉네임이 준비되지 않은 알림 화면 진입을 막는다: %j", async (state) => {
  useSignupDraftStore.setState(state);
  renderPage(SignupNotificationPage);
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith(routes.signupProfile),
  );
  expect(fetchMock).not.toHaveBeenCalled();
  expect(pushPermission).not.toHaveBeenCalled();
});

it("선택 약관 미동의는 정상 가입을 막지 않는다", () => {
  renderPage(SignupTermsPage);
  const next = screen.getByRole("button", { name: "다음" });
  expect(next.hasAttribute("disabled")).toBe(false);
  fireEvent.click(next);
  expect(router.push).toHaveBeenCalledWith(routes.signupProfile);
});

it("가입 성공 후 초안을 초기화해도 약관 화면으로 되돌아가지 않는다", async () => {
  fetchMock.mockImplementation(async (url) => {
    if (url === "/api/v1/users/oauth")
      return ok({ activeRefrigeratorIds: ["17"] });
    if (url === "/api/v1/auth/csrf") return new Response(null, { status: 204 });
    throw new Error(`Unexpected request: ${url}`);
  });
  renderPage(SignupNotificationPage);
  fireEvent.click(screen.getByRole("button", { name: "시작하기" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith(routes.home));
  expect(router.replace).toHaveBeenCalledTimes(1);
  expect(useSignupDraftStore.getState().nickname).toBe("");
});

it("푸시 권한 응답을 기다리는 동안 약관이 초기화되면 가입 요청을 보내지 않는다", async () => {
  let resolve!: (value: string) => void;
  pushSupport.mockReturnValue("supported");
  pushPermission.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  useSignupDraftStore.setState({ notificationEnabled: true });
  renderPage(SignupNotificationPage);
  fireEvent.click(screen.getByRole("button", { name: "시작하기" }));
  await waitFor(() => expect(pushPermission).toHaveBeenCalledTimes(1));
  await act(async () => {
    useSignupDraftStore.getState().reset();
    resolve("granted");
  });
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith(routes.signup),
  );
  expect(fetchMock).not.toHaveBeenCalled();
});

it("최종 가입에서 닉네임 중복이면 정보 입력 화면으로 복귀한다", async () => {
  fetchMock.mockResolvedValue(
    Response.json(
      { code: "USER-409-001", title: "중복", status: 409 },
      { status: 409 },
    ),
  );
  renderPage(SignupNotificationPage);
  fireEvent.click(screen.getByRole("button", { name: "시작하기" }));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith(routes.signupProfile),
  );
  expect(useSignupDraftStore.getState().nicknameError).toBe(
    "이미 사용 중이에요",
  );
});

it("가입 토큰 만료로 로그인에 복귀할 때 약관 가드와 충돌하지 않는다", async () => {
  fetchMock.mockResolvedValue(
    Response.json(
      { code: "USER-400-001", title: "가입 토큰 만료", status: 400 },
      { status: 400 },
    ),
  );
  renderPage(SignupNotificationPage);
  fireEvent.click(screen.getByRole("button", { name: "시작하기" }));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith(
      routes.loginWithReason("signup-expired"),
    ),
  );
  expect(router.replace).toHaveBeenCalledTimes(1);
});
