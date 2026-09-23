import { requestJson } from "@/shared/api";

export type LoginRequest = {
  loginId: string;
  password: string;
};

export type LoginResult = {
  activeRefrigeratorIds: string[];
};

export async function login(request: LoginRequest) {
  const response = await requestJson<LoginResult>("/auth/sessions", {
    method: "POST",
    json: request,
  });

  if (
    !Array.isArray(response.data?.activeRefrigeratorIds) ||
    !response.data.activeRefrigeratorIds.every(
      (refrigeratorId) => typeof refrigeratorId === "string",
    )
  ) {
    throw new TypeError("로그인 응답의 냉장고 목록 형식이 올바르지 않습니다.");
  }

  return response;
}
