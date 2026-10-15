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
const INVITATION_TTL_MS = 5 * 60 * 1000;

const JOIN_FAILURES: Record<string, { status: number; code: string }> = {
  MYOWN0: { status: 400, code: "REFRIGERATOR-400-001" },
  FULL00: { status: 400, code: "REFRIGERATOR-400-003" },
  EXPIRD: { status: 400, code: "REFRIGERATOR-400-004" },
  NOPE00: { status: 404, code: "REFRIGERATOR-404-002" },
  INSIDE: { status: 409, code: "REFRIGERATOR-409-001" },
};

let scenario: Scenario = "owner";
const profileOverride: { nickname?: string; profileImageUrl?: string | null } =
  {};
let members = createMembers(scenario);
let invitation: { code: string; expiresAt: string } | null = null;

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
    globalThis.document?.cookie.match(
      /(?:^|; )currentRefrigeratorId=([^;]*)/,
    )?.[1] ?? "1"
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
      nickname: profileOverride.nickname ?? me?.nickname ?? "오조사마",
      email: "dameokja@kakao.com",
      profileImageUrl: profileOverride.profileImageUrl ?? null,
      activeRefrigeratorIds: [currentRefrigeratorId()],
      cookingCount: 3,
    });
  }),
  http.patch("*/api/v1/users/me", async ({ request }) => {
    const body = (await request.json()) as {
      nickname: string;
      profileImage?: string | null;
    };
    if (body.nickname === "중복") return problem(409, "USER-409-001");
    profileOverride.nickname = body.nickname;
    if (body.profileImage !== undefined) {
      profileOverride.profileImageUrl =
        body.profileImage === null
          ? null
          : "https://picsum.photos/seed/dameokja/512";
    }
    return ok("USER-200-004", "회원정보 수정 성공", {
      userId: "1",
      nickname: profileOverride.nickname,
      profileImageUrl: profileOverride.profileImageUrl ?? null,
    });
  }),
  http.delete(
    "*/api/v1/users/me",
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.post("*/api/v1/image/presigned-url", async ({ request }) => {
    const body = (await request.clone().json()) as { purpose?: string };
    if (body.purpose !== "PROFILE") return;
    return ok("IMAGE-201-001", "업로드 URL 발급 성공", {
      objectKey: `profile/${Date.now()}.jpg`,
      uploadUrl: "/api/v1/mock/upload",
      method: "PUT",
      headers: {},
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    });
  }),
  http.put(
    "*/api/v1/mock/upload",
    () => new HttpResponse(null, { status: 200 }),
  ),
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
  http.get("*/api/v1/refrigerators/:refrigeratorId/invitations", () => {
    if (invitation && Date.parse(invitation.expiresAt) <= Date.now()) {
      invitation = null;
    }
    return ok("REFRIGERATOR-200-006", "초대코드 조회 성공", invitation);
  }),
  http.post("*/api/v1/refrigerators/:refrigeratorId/invitations", () => {
    invitation = {
      code: Math.random().toString(36).slice(2, 8).toUpperCase(),
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS).toISOString(),
    };
    return ok("REFRIGERATOR-200-002", "초대코드 발급 성공", {
      code: invitation.code,
    });
  }),
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
