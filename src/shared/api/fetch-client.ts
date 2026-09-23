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
import { SessionExpiredError } from "./session-expired-error";
import { refreshSession } from "./token-refresh";

function changesAuthentication(path: string, method: string): boolean {
  return (
    (path === "/auth/sessions" && (method === "POST" || method === "DELETE")) ||
    (path === "/users" && method === "POST")
  );
}

function isAuthEndpoint(path: string, method: string): boolean {
  return path.startsWith("/auth/") || (path === "/users" && method === "POST");
}

type RetryState = {
  csrfRetried: boolean;
  authRetried: boolean;
};

const INITIAL_RETRY_STATE: RetryState = {
  csrfRetried: false,
  authRetried: false,
};

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
};

async function sendRequest(
  path: string,
  options: ApiRequestOptions = {},
  retryState: RetryState = INITIAL_RETRY_STATE,
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
        // The next mutation will retry CSRF issuance.
      }
    }
    return response;
  }

  if (response.status === 401 && !isAuthEndpoint(path, method)) {
    if (retryState.authRetried) {
      throw new SessionExpiredError();
    }

    const refreshed = await refreshSession();
    if (refreshed) {
      return sendRequest(path, options, { ...retryState, authRetried: true });
    }
    throw new SessionExpiredError();
  }

  const problem = await readProblem(response);

  if (
    response.status === 403 &&
    problem.code === CSRF_ERROR_CODE &&
    !retryState.csrfRetried
  ) {
    const csrfToken = await refreshCsrfToken();
    if (csrfToken) {
      return sendRequest(path, options, { ...retryState, csrfRetried: true });
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
