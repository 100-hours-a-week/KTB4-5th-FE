const STORAGE_KEY = "dameokja.pushOptedOut";

// 로그아웃이 지운 구독과 사용자가 직접 끈 구독을 구분하려고 기기에 남긴다.
// 로그아웃해도 지우지 않는다.
export function isPushOptedOut(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPushOptedOut(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {}
}

export function clearPushOptedOut(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
