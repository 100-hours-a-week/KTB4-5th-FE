// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { showAppToast } from "@/shared/ui/app-toast";

import { RefrigeratorInvitePage } from "./refrigerator-invite-page";
import { RefrigeratorJoinPage } from "./refrigerator-join-page";
import { RefrigeratorSharePage } from "./refrigerator-share-page";

const router = vi.hoisted(() => {
  vi.stubEnv("NEXT_PUBLIC_KAKAOTECH_INVITE_CODE", "KTB150");
  return { push: vi.fn(), replace: vi.fn() };
});
afterAll(() => vi.unstubAllEnvs());

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast: vi.fn() }));
vi.mock("@/entities/user", async () => ({
  ...(await import("@/entities/user/api/user.queries")),
  UserAvatar: () => null,
}));
vi.mock("@/shared/ui/app-dialog", () => ({
  AppDialog: ({
    open,
    title,
    secondaryAction,
    primaryAction,
  }: {
    open: boolean;
    title: string;
    secondaryAction?: { label: string; onClick: () => void };
    primaryAction: { label: string; onClick: () => void };
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {secondaryAction ? (
          <button onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </button>
        ) : null}
        <button onClick={primaryAction.onClick}>{primaryAction.label}</button>
      </div>
    ) : null,
}));

const REFRIGERATOR_ID = "7";
const OWNER = { userId: "1", nickname: "오조사마", role: "owner" };
const MEMBER = { userId: "2", nickname: "헤니", role: "member" };

type Route = { method: string; path: string; respond: () => Response };
type Call = { method: string; path: string; init: RequestInit };

let routes: Route[] = [];
let calls: Call[] = [];
let currentUserId = OWNER.userId;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function ok(code: string, data: unknown, status = 200) {
  return () => json(status, { code, message: code, data });
}

function problem(status: number, code: string) {
  return () => json(status, { status, code, title: code });
}

function on(method: string, path: string, respond: () => Response) {
  routes.unshift({ method, path, respond });
}

function callsTo(method: string, path: string) {
  return calls.filter((call) => call.method === method && call.path === path);
}

function givenMe(userId: string) {
  currentUserId = userId;
}

function givenMembers(members: object[], memberMax = 150) {
  on(
    "GET",
    `/refrigerators/${REFRIGERATOR_ID}/members`,
    ok("REFRIGERATOR-200-003", {
      currentUserId,
      refrigeratorName: "오조사마",
      memberNum: members.length,
      memberMax,
      members: members.map((member) => ({
        ...member,
        profileImage: "default_image",
      })),
    }),
  );
}

function renderPage(page: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{page}</QueryClientProvider>,
  );
}

function cookieValue(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

beforeEach(() => {
  routes = [];
  calls = [];
  document.cookie = "XSRF-TOKEN=csrf-token; path=/";
  document.cookie = `currentRefrigeratorId=${REFRIGERATOR_ID}; path=/`;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      const path = input.replace(/^\/api\/v1/, "");
      calls.push({ method, path, init });
      const route = routes.find(
        (item) => item.method === method && item.path === path,
      );
      if (!route) throw new Error(`unexpected request: ${method} ${path}`);
      return route.respond();
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("내가 방장일 때", () => {
  beforeEach(() => givenMe(OWNER.userId));

  it("참여자를 내보낼 수 있고 초대 코드를 만들 수 있지만 나갈 수는 없다", async () => {
    givenMembers([OWNER, MEMBER]);
    renderPage(<RefrigeratorSharePage />);

    await screen.findByText("함께 쓰는 사람 2 / 150명");
    expect(screen.getByText("방장 · 나")).toBeTruthy();
    expect(callsTo("GET", "/users/me")).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: "내보내기" })).toHaveLength(1);
    expect(
      screen
        .getByRole("button", { name: "초대 코드 만들기" })
        .hasAttribute("disabled"),
    ).toBe(false);
    expect(screen.queryByRole("button", { name: "나가기" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "다른 냉장고 참여하기" }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "초대 코드 만들기" }));
    expect(router.push).toHaveBeenCalledWith("/refrigerator/share/invite");
  });

  it("정원이 가득 차면 초대 코드를 만들 수 없다", async () => {
    givenMembers([
      OWNER,
      ...Array.from({ length: 149 }, (_, index) => ({
        userId: String(index + 2),
        nickname: `참여자${index}`,
        role: "member",
      })),
    ]);
    renderPage(<RefrigeratorSharePage />);

    const invite = await screen.findByRole("button", {
      name: "초대 코드 만들기",
    });
    expect(invite.hasAttribute("disabled")).toBe(true);
    expect(
      screen.getByText(
        "정원이 다 찼어요. 참여자를 내보내야 새로 초대할 수 있어요.",
      ),
    ).toBeTruthy();
  });

  it("혼자 쓰는 중이면 다른 냉장고에 참여하러 갈 수 있다", async () => {
    givenMembers([OWNER]);
    renderPage(<RefrigeratorSharePage />);

    fireEvent.click(
      await screen.findByRole("button", { name: "다른 냉장고 참여하기" }),
    );
    expect(router.push).toHaveBeenCalledWith("/refrigerator/share/join");
  });

  it("참여자를 내보내면 CSRF 헤더와 함께 삭제하고 목록을 다시 불러온다", async () => {
    givenMembers([OWNER, MEMBER]);
    const path = `/refrigerators/${REFRIGERATOR_ID}/members/${MEMBER.userId}`;
    on("DELETE", path, () => {
      givenMembers([OWNER]);
      return new Response(null, { status: 204 });
    });
    renderPage(<RefrigeratorSharePage />);

    fireEvent.click(await screen.findByRole("button", { name: "내보내기" }));
    const dialog = screen.getByRole("dialog", {
      name: "헤니 님을 내보낼까요?",
    });
    fireEvent.click(
      Array.from(dialog.querySelectorAll("button")).find(
        (button) => button.textContent === "내보내기",
      )!,
    );

    await screen.findByText("함께 쓰는 사람 1 / 150명");
    const [removeCall] = callsTo("DELETE", path);
    expect(new Headers(removeCall?.init.headers).get("X-XSRF-TOKEN")).toBe(
      "csrf-token",
    );
    expect(screen.queryByText("헤니")).toBeNull();
  });

  it("내보내기에 실패하면 오류 토스트를 띄운다", async () => {
    givenMembers([OWNER, MEMBER]);
    on(
      "DELETE",
      `/refrigerators/${REFRIGERATOR_ID}/members/${MEMBER.userId}`,
      problem(404, "REFRIGERATOR-404-003"),
    );
    renderPage(<RefrigeratorSharePage />);

    fireEvent.click(await screen.findByRole("button", { name: "내보내기" }));
    fireEvent.click(
      screen.getAllByRole("button", { name: "내보내기" }).at(-1)!,
    );

    await waitFor(() =>
      expect(showAppToast).toHaveBeenCalledWith({
        message: "내보내지 못했어요. 다시 시도해 주세요",
        variant: "error",
      }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("유효한 초대 코드가 있으면 새로 발급하지 않고 남은 시간과 함께 보여준다", async () => {
    on(
      "GET",
      `/refrigerators/${REFRIGERATOR_ID}/invitations`,
      ok("REFRIGERATOR-200-006", {
        code: "P2F32Y",
        expiresAt: new Date(Date.now() + 3 * 60_000).toISOString(),
      }),
    );
    renderPage(<RefrigeratorInvitePage />);

    await screen.findByText("P2F-32Y");
    expect(screen.getByText(/^0[23]:\d{2} 후 만료$/)).toBeTruthy();
    expect(
      callsTo("POST", `/refrigerators/${REFRIGERATOR_ID}/invitations`),
    ).toHaveLength(0);
  });

  it("유효한 초대 코드가 없으면 발급한 뒤 다시 조회해 보여준다", async () => {
    const path = `/refrigerators/${REFRIGERATOR_ID}/invitations`;
    on("GET", path, ok("REFRIGERATOR-200-006", null));
    on("POST", path, () => {
      on(
        "GET",
        path,
        ok("REFRIGERATOR-200-006", {
          code: "A7K3F9",
          expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        }),
      );
      return ok("REFRIGERATOR-200-002", { code: "A7K3F9" })();
    });
    renderPage(<RefrigeratorInvitePage />);

    await screen.findByText("A7K-3F9");
    expect(callsTo("POST", path)).toHaveLength(1);
    expect(callsTo("GET", path)).toHaveLength(2);
  });

  it("초대 코드가 만료되면 새 코드를 만들 수 있다", async () => {
    const path = `/refrigerators/${REFRIGERATOR_ID}/invitations`;
    on(
      "GET",
      path,
      ok("REFRIGERATOR-200-006", {
        code: "P2F32Y",
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }),
    );
    on("POST", path, ok("REFRIGERATOR-200-002", { code: "NEW123" }));
    renderPage(<RefrigeratorInvitePage />);

    await screen.findByText("만료된 코드예요");
    fireEvent.click(screen.getByRole("button", { name: "새 코드 만들기" }));
    await waitFor(() => expect(callsTo("POST", path)).toHaveLength(1));
  });
});

describe("내가 참여자일 때", () => {
  beforeEach(() => givenMe(MEMBER.userId));

  it("내보내기·초대 없이 나가기만 할 수 있고, 다른 냉장고 참여는 막힌다", async () => {
    givenMembers([OWNER, MEMBER]);
    renderPage(<RefrigeratorSharePage />);

    await screen.findByText("참여자 · 나");
    expect(screen.queryByRole("button", { name: "내보내기" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "초대 코드 만들기" }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "나가기" })).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "다른 냉장고 참여하기" }),
    );
    expect(showAppToast).toHaveBeenCalledWith({
      message: "지금 냉장고에서 나간 뒤 참여할 수 있어요",
      variant: "error",
    });
    expect(router.push).not.toHaveBeenCalled();
  });

  it("냉장고를 나가면 응답의 다음 냉장고로 바꾸고 홈으로 이동한다", async () => {
    givenMembers([OWNER, MEMBER]);
    const path = `/refrigerators/${REFRIGERATOR_ID}/members/me`;
    on(
      "DELETE",
      path,
      ok("REFRIGERATOR-200-005", { activeRefrigeratorIds: ["1"] }),
    );
    on("GET", "/refrigerators/current", ok("X", []));
    renderPage(<RefrigeratorSharePage />);

    fireEvent.click(await screen.findByRole("button", { name: "나가기" }));
    fireEvent.click(screen.getAllByRole("button", { name: "나가기" }).at(-1)!);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(cookieValue("currentRefrigeratorId")).toBe("1");
    expect(
      new Headers(callsTo("DELETE", path)[0]?.init.headers).get("X-XSRF-TOKEN"),
    ).toBe("csrf-token");
  });

  it("나가기에 실패하면 오류 토스트를 띄우고 머문다", async () => {
    givenMembers([OWNER, MEMBER]);
    on(
      "DELETE",
      `/refrigerators/${REFRIGERATOR_ID}/members/me`,
      problem(400, "REFRIGERATOR-400-005"),
    );
    renderPage(<RefrigeratorSharePage />);

    fireEvent.click(await screen.findByRole("button", { name: "나가기" }));
    fireEvent.click(screen.getAllByRole("button", { name: "나가기" }).at(-1)!);

    await waitFor(() =>
      expect(showAppToast).toHaveBeenCalledWith({
        message: "나가지 못했어요. 다시 시도해 주세요",
        variant: "error",
      }),
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("초대 코드로 참여하면 참여한 냉장고로 바꾸고 홈으로 이동한다", async () => {
    on(
      "POST",
      "/refrigerators/members",
      ok(
        "REFRIGERATOR-201-001",
        { refrigeratorId: "2", activeRefrigeratorIds: ["2"] },
        201,
      ),
    );
    renderPage(<RefrigeratorJoinPage />);

    const join = screen.getByRole("button", { name: "참여하기" });
    expect(join.hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getByRole("textbox", { name: "초대 코드" }), {
      target: { value: "p2f-32y" },
    });
    fireEvent.click(join);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    const [joinCall] = callsTo("POST", "/refrigerators/members");
    expect(JSON.parse(String(joinCall?.init.body))).toEqual({
      inviteCode: "P2F32Y",
    });
    expect(cookieValue("currentRefrigeratorId")).toBe("2");
    expect(showAppToast).toHaveBeenCalledWith({
      message: "함께 쓰기 시작했어요",
      variant: "success",
    });
  });

  it.each([
    ["REFRIGERATOR-404-002", 404, "없는 코드예요"],
    ["REFRIGERATOR-400-002", 400, "코드 형식을 확인해 주세요"],
    ["REFRIGERATOR-400-001", 400, "내 냉장고 코드로는 참여할 수 없어요"],
  ])("참여 실패 %s는 입력란 아래에 안내한다", async (code, status, message) => {
    on("POST", "/refrigerators/members", problem(status, code));
    renderPage(<RefrigeratorJoinPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "초대 코드" }), {
      target: { value: "ABC123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "참여하기" }));

    await screen.findByText(message);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it.each([
    ["REFRIGERATOR-400-004", "코드가 유효하지 않습니다."],
    ["REFRIGERATOR-400-003", "공유받을 냉장고의 인원이 가득 찼습니다."],
  ])("참여 실패 %s는 확인창으로 안내한다", async (code, title) => {
    on("POST", "/refrigerators/members", problem(400, code));
    renderPage(<RefrigeratorJoinPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "초대 코드" }), {
      target: { value: "ABC123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "참여하기" }));

    await screen.findByRole("dialog", { name: title });
  });

  it("이미 다른 냉장고에 참여 중이면 나간 뒤 참여하라고 안내한다", async () => {
    on("POST", "/refrigerators/members", problem(409, "REFRIGERATOR-409-001"));
    renderPage(<RefrigeratorJoinPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "초대 코드" }), {
      target: { value: "ABC123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "참여하기" }));

    await waitFor(() =>
      expect(showAppToast).toHaveBeenCalledWith({
        message: "지금 냉장고에서 나간 뒤 참여할 수 있어요",
        variant: "error",
      }),
    );
  });
});

it("카테부 참여 확인 후 설정된 코드로 같은 참여 API를 호출한다", async () => {
  on(
    "POST",
    "/refrigerators/members",
    ok(
      "REFRIGERATOR-201-001",
      {
        refrigeratorId: "150",
        activeRefrigeratorIds: ["150"],
      },
      201,
    ),
  );
  givenMe(OWNER.userId);
  givenMembers([OWNER]);
  renderPage(<RefrigeratorSharePage />);
  fireEvent.click(
    await screen.findByRole("button", { name: "카테부 냉장고 참여하기" }),
  );
  expect(
    screen.getByRole("dialog", {
      name: "카테부 냉장고에 참여할까요?",
    }),
  ).toBeTruthy();
  expect(callsTo("POST", "/refrigerators/members")).toHaveLength(0);
  const dialog = screen.getByRole("dialog", {
    name: "카테부 냉장고에 참여할까요?",
  });
  fireEvent.click(
    Array.from(dialog.querySelectorAll("button")).find(
      (button) => button.textContent === "참여하기",
    )!,
  );
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  expect(cookieValue("currentRefrigeratorId")).toBe("150");
  expect(
    JSON.parse(String(callsTo("POST", "/refrigerators/members")[0].init.body)),
  ).toEqual({ inviteCode: "KTB150" });
});
