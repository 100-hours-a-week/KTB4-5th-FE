const WINDOW_MS = 10 * 60 * 1000;
const MAX_REPORTS_PER_WINDOW = 5;
const MAX_TRACKED_USERS = 10_000;
const CLEANUP_INTERVAL_MS = 60_000;

// shortcut: 프로세스별 제한이며 재시작 시 초기화된다. 다중 인스턴스 통합 제한이 필요하면 서버 저장소로 옮긴다.
const reportTimesByKey = new Map<string, number[]>();
let nextCleanupAt = 0;

export function consumeBugReportQuota(key: string, now = Date.now()): boolean {
  if (now >= nextCleanupAt) {
    for (const [userId, times] of reportTimesByKey) {
      if (now - times[times.length - 1]! >= WINDOW_MS) {
        reportTimesByKey.delete(userId);
      }
    }
    nextCleanupAt = now + CLEANUP_INTERVAL_MS;
  }

  if (
    !reportTimesByKey.has(key) &&
    reportTimesByKey.size >= MAX_TRACKED_USERS
  ) {
    return false;
  }

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
