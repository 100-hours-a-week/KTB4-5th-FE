import { ApiError } from "./api-error";
import { API_BASE_PATH } from "./api-base-path";
import type { ApiResponse } from "./contract";
import {
  CSRF_ERROR_CODE,
  CSRF_HEADER_NAME,
  ensureCsrfToken,
  isCsrfProtectedRequest,
  refreshCsrfToken,
} from "./csrf";
import { isApiResponse, readProblem } from "./response-parsing";

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
};

function changesAuthentication(path: string, method: string): boolean {
  return (
    (path === "/auth/sessions" && (method === "POST" || method === "DELETE")) ||
    (path === "/users" && method === "POST")
  );
}

async function sendRequest(
  path: string,
  options: ApiRequestOptions = {},
  csrfRetried = false,
): Promise<Response> {
  const { json, headers: inputHeaders, ...init } = options;

  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new TypeError("API 경로는 /로 시작하는 상대 경로여야 합니다.");
  }

  const method = init.method?.toUpperCase() ?? "GET";
  const headers = new Headers(inputHeaders);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json, application/problem+json");
  }

  let body: string | undefined;
  if (json !== undefined) {
    body = JSON.stringify(json);
    if (body === undefined) {
      throw new TypeError("요청 본문을 JSON으로 변환할 수 없습니다.");
    }
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  // CSRF 검증 대상 요청마다 XSRF-TOKEN 쿠키 값을 X-XSRF-TOKEN 헤더로 복사한다.
  // 쿠키가 없으면 ensureCsrfToken이 먼저 GET /auth/csrf로 발급받는다.
  if (isCsrfProtectedRequest(path, method) && !headers.has(CSRF_HEADER_NAME)) {
    const csrfToken = await ensureCsrfToken();
    if (!csrfToken) {
      throw new TypeError("CSRF 토큰 쿠키가 발급되지 않았습니다.");
    }
    headers.set(CSRF_HEADER_NAME, csrfToken);
  }

  const response = await fetch(`${API_BASE_PATH}${path}`, {
    ...init,
    headers,
    body,
    credentials: "include",
  });

  if (response.ok) {
    if (changesAuthentication(path, method)) {
      try {
        await refreshCsrfToken();
      } catch {
        // Keep the successful authentication result. The next mutation will
        // retry issuance before sending its request.
      }
    }
    return response;
  }

  const problem = await readProblem(response);

  // 403 서버 오류 코드 COMMON-403-CSRF-001만 토큰 재발급 후 원 요청 1회 재시도.
  if (
    response.status === 403 &&
    problem.code === CSRF_ERROR_CODE &&
    !csrfRetried
  ) {
    const csrfToken = await refreshCsrfToken();
    if (csrfToken) {
      return sendRequest(path, options, true);
    }
  }

  throw new ApiError(response.status, problem);
}

export async function requestJson<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const response = await sendRequest(path, options);

  if (
    response.status === 204 ||
    response.status === 205 ||
    options.method?.toUpperCase() === "HEAD"
  ) {
    throw new TypeError("JSON 응답을 기대했지만 본문이 없습니다.");
  }

  const value: unknown = await response.json();
  if (!isApiResponse(value)) {
    throw new TypeError("API 성공 응답 형식이 올바르지 않습니다.");
  }

  return value as ApiResponse<T>;
}

export async function requestNoContent(
  path: string,
  options: ApiRequestOptions = {},
): Promise<void> {
  const response = await sendRequest(path, options);

  if (
    response.status !== 204 &&
    response.status !== 205 &&
    options.method?.toUpperCase() !== "HEAD"
  ) {
    throw new TypeError(
      "본문 없는 응답을 기대했지만 다른 성공 상태를 받았습니다.",
    );
  }
}
