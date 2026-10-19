import { requestJson } from "@/shared/api";

export type CompleteOAuthSignupRequest = {
  nickname: string;
  notificationSetting: boolean;
};

export type CompleteOAuthSignupResult = {
  activeRefrigeratorIds: string[];
};

export async function completeOAuthSignup(request: CompleteOAuthSignupRequest) {
  const response = await requestJson<CompleteOAuthSignupResult>(
    "/users/oauth",
    { method: "POST", json: request },
  );

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
