const WINDOW_MS = 10 * 60 * 1000;
const MAX_REPORTS_PER_WINDOW = 5;

// 프로세스 메모리 기준이라 재시작하면 초기화된다. 도배 방지 목적으로만 쓴다.
const reportTimesByKey = new Map<string, number[]>();

export function consumeBugReportQuota(key: string, now = Date.now()): boolean {
  const recent = (reportTimesByKey.get(key) ?? []).filter(
    (time) => now - time < WINDOW_MS,
  );

  if (recent.length >= MAX_REPORTS_PER_WINDOW) {
    reportTimesByKey.set(key, recent);
    return false;
  }

  recent.push(now);
  reportTimesByKey.set(key, recent);
  return true;
}
