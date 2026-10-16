import { http, HttpResponse } from "msw";

import type { ApiResponse } from "@/shared/api";

const profileOverride: { nickname?: string; profileImageUrl?: string | null } =
  {};

function ok<T>(code: string, message: string, data: T, status = 200) {
  return HttpResponse.json<ApiResponse<T>>({ code, message, data }, { status });
}

function problem(status: number, code: string) {
  return HttpResponse.json(
    { type: "about:blank", title: code, status, detail: code, code },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

export const userHandlers = [
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
];
