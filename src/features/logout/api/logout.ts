import { requestJson } from "@/shared/api";

// docs/AUTH_SESSION_SECURITY.md §8.1(실측 확인): 200 AUTH-200-002와 함께
// access/refresh 쿠키가 Max-Age=0으로 삭제되고 새 XSRF-TOKEN이 내려온다.
export function logout() {
  return requestJson<null>("/auth/sessions", { method: "DELETE" });
}
