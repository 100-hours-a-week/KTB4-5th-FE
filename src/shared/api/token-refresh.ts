import { API_BASE_PATH } from "./api-base-path";
import { CSRF_HEADER_NAME, ensureCsrfToken } from "./csrf";

let refreshPromise: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function performRefresh(): Promise<boolean> {
  if (typeof document === "undefined") {
    return false;
  }

  try {
    const csrfToken = await ensureCsrfToken();
    if (!csrfToken) {
      return false;
    }

    const response = await fetch(`${API_BASE_PATH}/auth/token-renewals`, {
      method: "POST",
      credentials: "include",
      headers: { [CSRF_HEADER_NAME]: csrfToken },
    });

    return response.ok;
  } catch {
    return false;
  }
}
