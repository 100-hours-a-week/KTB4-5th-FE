import { getCookieValue } from "@/shared/lib/cookie";

import { API_BASE_PATH } from "./api-base-path";

const CSRF_COOKIE_NAME = "XSRF-TOKEN";
export const CSRF_HEADER_NAME = "X-XSRF-TOKEN";
export const CSRF_ERROR_CODE = "COMMON-403-CSRF-001";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// 공통 API 명세: 조회 전용인 닉네임 중복 검사 POST는 CSRF 검증 대상이 아니다.
const CSRF_EXEMPT_PATHS = new Set(["/users/nickname-validations"]);

export function isCsrfProtectedRequest(
  path: string,
  method: string | undefined,
): boolean {
  return (
    MUTATING_METHODS.has((method ?? "GET").toUpperCase()) &&
    !CSRF_EXEMPT_PATHS.has(path)
  );
}

function readCsrfCookie(): string | null {
  return getCookieValue(CSRF_COOKIE_NAME);
}

let issuePromise: Promise<void> | null = null;

// 유효한 토큰이 있어도 서버가 재사용하기 때문에 중복 호출해도 안전하다. 다만
// 여러 요청이 동시에 발급을 기다릴 수 있어 진행 중인 요청 하나를 같이 쓴다.
// `force`는 인증 상태가 바뀐 뒤 재발급이라, 상태가 바뀌기 전에 떠난 요청에
// 편승하면 이전 토큰을 읽게 되므로 항상 새 요청을 보낸다.
function issueCsrfToken(force = false): Promise<void> {
  if (!force && issuePromise) {
    return issuePromise;
  }

  const issuing = (async () => {
    await fetch(`${API_BASE_PATH}/auth/csrf`, {
      method: "GET",
      credentials: "include",
    });
  })().finally(() => {
    if (issuePromise === issuing) {
      issuePromise = null;
    }
  });

  issuePromise = issuing;
  return issuing;
}

// XSRF-TOKEN 쿠키 값을 읽어 돌려준다. 쿠키가 없으면 먼저 발급받은 뒤 다시 읽는다.
// Server Component 등 브라우저가 아닌 환경에서는 `null`을 돌려준다
export async function ensureCsrfToken(): Promise<string | null> {
  if (typeof document === "undefined") {
    return null;
  }

  const existing = readCsrfCookie();
  if (existing) {
    return existing;
  }

  await issueCsrfToken();
  return readCsrfCookie();
}

// 캐시된 쿠키를 믿지 않고 강제로 새 토큰을 받아온다. `403 COMMON-403-CSRF-001` 재시도, 로그인·로그아웃·OAuth 콜백 직후 재발급에 사용한다.
export async function refreshCsrfToken(): Promise<string | null> {
  if (typeof document === "undefined") {
    return null;
  }

  await issueCsrfToken(true);
  return readCsrfCookie();
}
