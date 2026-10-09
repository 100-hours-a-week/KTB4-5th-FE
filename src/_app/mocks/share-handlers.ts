import { http, HttpResponse } from "msw";

import type { ApiResponse } from "@/shared/api";

type Scenario = "owner" | "member" | "alone" | "full";

type MockMember = {
  userId: string;
  nickname: string;
  profileImage: string;
  role: "owner" | "member";
};

const SCENARIOS: readonly Scenario[] = ["owner", "member", "alone", "full"];
const MEMBER_MAX = 4;

const JOIN_FAILURES: Record<string, { status: number; code: string }> = {
  MYOWN0: { status: 400, code: "REFRIGERATOR-400-001" },
  FULL00: { status: 400, code: "REFRIGERATOR-400-003" },
  EXPIRD: { status: 400, code: "REFRIGERATOR-400-004" },
  NOPE00: { status: 404, code: "REFRIGERATOR-404-002" },
  INSIDE: { status: 409, code: "REFRIGERATOR-409-001" },
};

let scenario: Scenario = "owner";
let members = createMembers(scenario);

function member(
  userId: string,
  nickname: string,
  role: MockMember["role"],
): MockMember {
  return { userId, nickname, profileImage: "default_image", role };
}

function createMembers(next: Scenario): MockMember[] {
  switch (next) {
    case "member":
      return [member("1", "오조사마", "owner"), member("2", "헤니", "member")];
    case "alone":
      return [member("1", "오조사마", "owner")];
    case "full":
      return [
        member("1", "오조사마", "owner"),
        member("2", "헤니", "member"),
        member("3", "다먹자", "member"),
        member("4", "냉장고", "member"),
      ];
    default:
      return [member("1", "오조사마", "owner"), member("2", "헤니", "member")];
  }
}

function syncScenario() {
  const value = new URLSearchParams(globalThis.location?.search).get("share");
  const next = SCENARIOS.find((item) => item === value);
  if (next && next !== scenario) {
    scenario = next;
    members = createMembers(next);
  }
}

function currentRefrigeratorId(): string {
  return (
    globalThis.localStorage?.getItem("dameokja.currentRefrigeratorId") ?? "1"
  );
}

function ok<T>(code: string, message: string, data: T, status = 200) {
  return HttpResponse.json<ApiResponse<T>>({ code, message, data }, { status });
}

function problem(status: number, code: string) {
  return HttpResponse.json(
    { type: "about:blank", title: code, status, detail: code, code },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

export const shareHandlers = [
  http.get("*/api/v1/users/me", () => {
    syncScenario();
    const me = scenario === "member" ? members[1] : members[0];
    return ok("USER-200-003", "회원정보 조회 성공", {
      userId: me?.userId ?? "1",
      nickname: me?.nickname ?? "오조사마",
      profileImageUrl: null,
      activeRefrigeratorIds: [currentRefrigeratorId()],
      cookingCount: 3,
    });
  }),
  http.get("*/api/v1/refrigerators/:refrigeratorId/members", () => {
    syncScenario();
    return ok("REFRIGERATOR-200-003", "냉장고 공유 참여자 목록 조회 성공", {
      refrigeratorName: "오조사마네 냉장고",
      memberNum: members.length,
      memberMax: MEMBER_MAX,
      members,
    });
  }),
  http.get("*/api/v1/refrigerators/:refrigeratorId/members/stats", () => {
    syncScenario();
    return ok("REFRIGERATOR-200-004", "냉장고 참여 인원 조회 성공", {
      memberNum: members.length,
    });
  }),
  http.post("*/api/v1/refrigerators/:refrigeratorId/invitations", () =>
    ok("REFRIGERATOR-200-002", "초대코드 발급 성공", {
      code: Math.random().toString(36).slice(2, 8).toUpperCase(),
    }),
  ),
  http.post("*/api/v1/refrigerators/members", async ({ request }) => {
    const { inviteCode } = (await request.json()) as { inviteCode: string };
    const failure = JOIN_FAILURES[inviteCode];
    if (failure) return problem(failure.status, failure.code);

    const refrigeratorId = currentRefrigeratorId();
    return ok(
      "REFRIGERATOR-201-001",
      "냉장고 참여 성공.",
      { refrigeratorId, activeRefrigeratorIds: [refrigeratorId] },
      201,
    );
  }),
  http.delete("*/api/v1/refrigerators/:refrigeratorId/members/me", () =>
    ok("REFRIGERATOR-200-005", "냉장고 공유 나가기 성공.", {
      activeRefrigeratorIds: [currentRefrigeratorId()],
    }),
  ),
  http.delete(
    "*/api/v1/refrigerators/:refrigeratorId/members/:memberId",
    ({ params }) => {
      members = members.filter((item) => item.userId !== params.memberId);
      return new HttpResponse(null, { status: 204 });
    },
  ),
];
