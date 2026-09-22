import { requestJson } from "@/shared/api";

// docs/AUTH_SESSION_SECURITY.md §8.1: POST /api/v1/users (실측으로 추가한
// 엔드포인트, API 시트 §8.1 표에는 없었음). 가입과 동시에 로그인되어
// access/refresh 쿠키도 함께 내려온다(실측 확인).
export type SignupRequest = {
  loginId: string;
  password: string;
};

export type SignupResult = {
  activeRefrigeratorIds: string[];
};

export function signup(request: SignupRequest) {
  return requestJson<SignupResult>("/users", {
    method: "POST",
    json: request,
  });
}
