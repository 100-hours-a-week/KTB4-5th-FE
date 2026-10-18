// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import {
  dismissKakaotechJoinPrompt,
  useKakaotechJoinPrompt,
} from "@/features/share-refrigerator";
import { showAppToast } from "@/shared/ui/app-toast";

import { HomeKakaotechJoinPrompt } from "./home-kakaotech-join-prompt";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
const reload = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast: vi.fn() }));

const owner = { userId: "1", nickname: "사용자", role: "owner" };
let members = [owner];
let joinStatus = 201;
let finishJoin: (() => void) | undefined;

function CurrentRefrigeratorState() {
  const refrigeratorId = useCurrentRefrigeratorId();
  return <output aria-label="선택한 냉장고">{refrigeratorId}</output>;
}

function renderPrompt(refrigeratorId = "7") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <CurrentRefrigeratorState />
      <HomeKakaotechJoinPrompt
        key={refrigeratorId}
        refrigeratorId={refrigeratorId}
      />
    </QueryClientProvider>,
  );
  return { ...view, client };
}

beforeEach(() => {
  vi.stubGlobal("location", { pathname: "/", reload });
  vi.stubEnv("NEXT_PUBLIC_KAKAOTECH_INVITE_CODE", "KTB150");
  localStorage.clear();
  members = [owner];
  joinStatus = 201;
  finishJoin = undefined;
  document.cookie = "currentRefrigeratorId=7; path=/";
  document.cookie = "XSRF-TOKEN=csrf-token; path=/";
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false;
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init: RequestInit = {}) => {
      if (init.method === "POST") {
        expect(input).toBe("/api/v1/refrigerators/members");
        expect(JSON.parse(String(init.body))).toEqual({ inviteCode: "KTB150" });
        expect(new Headers(init.headers).get("X-XSRF-TOKEN")).toBe(
          "csrf-token",
        );
        await new Promise<void>((resolve) => {
          finishJoin = resolve;
        });
        return new Response(
          JSON.stringify(
            joinStatus === 201
              ? {
                  code: "REFRIGERATOR-201-001",
                  message: "ok",
                  data: { refrigeratorId: "150" },
                }
              : { status: 400, code: "REFRIGERATOR-400-003", title: "full" },
          ),
          { status: joinStatus },
        );
      }
      return new Response(
        JSON.stringify({
          code: "REFRIGERATOR-200-003",
          message: "ok",
          data: {
            currentUserId: "1",
            refrigeratorName: "개인",
            memberNum: members.length,
            memberMax: 150,
            members,
          },
        }),
      );
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("기존 계정도 표시값 없이 카드를 보고 나중에 선택하면 재방문에도 숨긴다", async () => {
  const view = renderPrompt();
  fireEvent.click(await screen.findByRole("button", { name: "나중에" }));
  expect(showAppToast).toHaveBeenCalledWith({
    message: "마이페이지 냉장고 공유 기능에서 참여하실 수 있습니다.",
    variant: "success",
  });
  expect(screen.queryByText("카테부 냉장고, 지금 참여해 보세요!")).toBeNull();
  view.unmount();
  renderPrompt();
  expect(screen.queryByText("카테부 냉장고, 지금 참여해 보세요!")).toBeNull();
});

it("한 계정에서 닫아도 다른 냉장고의 안내는 숨기지 않는다", async () => {
  dismissKakaotechJoinPrompt("7");
  renderPrompt("8");
  expect(
    await screen.findByRole("button", { name: "카테부 냉장고 참여하기" }),
  ).toBeTruthy();
});

it("초대 코드 미설정이면 카드와 참여자 조회를 생략한다", () => {
  vi.stubEnv("NEXT_PUBLIC_KAKAOTECH_INVITE_CODE", "");
  renderPrompt();
  expect(screen.queryByText("카테부 냉장고, 지금 참여해 보세요!")).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

it.each([
  [owner, { userId: "2", nickname: "참여자", role: "member" }],
  [{ ...owner, role: "member" }],
])(
  "이미 공유 중이거나 방장이 아니면 권유하지 않는다: %j",
  async (...givenMembers) => {
    members = givenMembers;
    const { client } = renderPrompt();
    await waitFor(() =>
      expect(
        client.getQueryState(["refrigerators", "7", "members"])?.status,
      ).toBe("success"),
    );
    expect(screen.queryByText("카테부 냉장고, 지금 참여해 보세요!")).toBeNull();
  },
);

it("확인 전에는 요청하지 않고 취소 후에도 카드를 유지한다", async () => {
  renderPrompt();
  fireEvent.click(
    await screen.findByRole("button", { name: "카테부 냉장고 참여하기" }),
  );
  expect(screen.getByText(/내 냉장고 재료는 옮겨지지 않고/)).toBeTruthy();
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "취소" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("button", { name: "나중에" })).toBeTruthy();
});

it("참여 요청 중 재제출을 막고 성공 후 새로고침 없이 선택한 냉장고를 반영한다", async () => {
  renderPrompt();
  fireEvent.click(
    await screen.findByRole("button", { name: "카테부 냉장고 참여하기" }),
  );
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "참여하기",
    }),
  );
  await waitFor(() => expect(finishJoin).toBeTypeOf("function"));
  expect(
    screen
      .getByRole("button", { name: "카테부 냉장고 참여하기" })
      .hasAttribute("disabled"),
  ).toBe(true);
  finishJoin!();
  await waitFor(() =>
    expect(screen.getByLabelText("선택한 냉장고").textContent).toBe("150"),
  );
  expect(reload).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
  expect(showAppToast).toHaveBeenCalledWith({
    message: "함께 쓰기 시작했어요",
    variant: "success",
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(document.cookie).toContain("currentRefrigeratorId=150");
  expect(screen.queryByText("카테부 냉장고, 지금 참여해 보세요!")).toBeNull();
});

it("참여 실패 시 안내를 유지하고 다시 시도할 수 있다", async () => {
  joinStatus = 400;
  renderPrompt();
  fireEvent.click(
    await screen.findByRole("button", { name: "카테부 냉장고 참여하기" }),
  );
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "참여하기",
    }),
  );
  await waitFor(() => expect(finishJoin).toBeTypeOf("function"));
  finishJoin!();
  await waitFor(() =>
    expect(showAppToast).toHaveBeenCalledWith({
      message: "공유받을 냉장고의 인원이 가득 찼습니다.",
      variant: "error",
    }),
  );
  expect(router.replace).not.toHaveBeenCalled();
  expect(reload).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "나중에" })).toBeTruthy();
});

it("브라우저 저장소를 차단해도 홈을 방해하지 않는다", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(() => dismissKakaotechJoinPrompt("7")).not.toThrow();
  function PromptState() {
    return <span>{String(useKakaotechJoinPrompt("7"))}</span>;
  }
  render(<PromptState />);
  expect(screen.getByText("false")).toBeTruthy();
});
