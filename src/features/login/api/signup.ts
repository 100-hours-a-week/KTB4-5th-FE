import { requestJson } from "@/shared/api";

import type { LoginRequest, LoginResult } from "./login";

export type SignupRequest = LoginRequest;
export type SignupResult = LoginResult;

export async function signup(request: SignupRequest) {
  const response = await requestJson<SignupResult>("/users", {
    method: "POST",
    json: request,
  });

  if (
    !Array.isArray(response.data?.activeRefrigeratorIds) ||
    !response.data.activeRefrigeratorIds.every(
      (refrigeratorId) => typeof refrigeratorId === "string",
    )
  ) {
    throw new TypeError(
      "회원가입 응답의 냉장고 목록 형식이 올바르지 않습니다.",
    );
  }

  return response;
}
