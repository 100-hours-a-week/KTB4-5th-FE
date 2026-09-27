import { API_BASE_PATH } from "./api-base-path";
import { CSRF_HEADER_NAME, ensureCsrfToken } from "./csrf";

/**
 * - `renewed`: 새 access/refresh 쿠키를 받았다.
 * - `rejected`: 서버가 refresh 토큰을 거절했다. 다시 로그인해야 한다.
 * - `failed`: 네트워크·서버 오류로 판단하지 못했다. 세션은 그대로일 수 있다.
 */
export type SessionRefreshResult = "renewed" | "rejected" | "failed";

let refreshPromise: Promise<SessionRefreshResult> | null = null;

export function refreshSession(): Promise<SessionRefreshResult> {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function performRefresh(): Promise<SessionRefreshResult> {
  if (typeof document === "undefined") {
    return "failed";
  }

  try {
    const csrfToken = await ensureCsrfToken();
    if (!csrfToken) {
      return "failed";
    }

    const response = await fetch(`${API_BASE_PATH}/auth/token-renewals`, {
      method: "POST",
      credentials: "include",
      headers: { [CSRF_HEADER_NAME]: csrfToken },
    });

    if (response.ok) {
      return "renewed";
    }
    return response.status === 401 ? "rejected" : "failed";
  } catch {
    return "failed";
  }
}
