function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return { year, month, day };
}

// 남은 일수를 큰 D-day 표기로 바꾼다. 당일은 `D-0`, 만료는 `D+n`이다.
export function formatDDay(daysUntilExpiration: number): string {
  return daysUntilExpiration < 0
    ? `D+${Math.abs(daysUntilExpiration)}`
    : `D-${daysUntilExpiration}`;
}

// 2026-09-05 → 2026.09.05
export function formatDetailDate(date: string): string {
  return date.replaceAll("-", ".");
}

// 2026-09-05 → 2026년 9월 5일까지
export function formatExpirationDeadline(date: string): string {
  const { year, month, day } = parseDate(date);

  return `${year}년 ${month}월 ${day}일까지`;
}
