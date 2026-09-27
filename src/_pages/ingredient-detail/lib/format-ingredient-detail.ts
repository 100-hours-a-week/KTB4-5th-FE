export function formatDDay(daysUntilExpiration: number): string {
  return daysUntilExpiration < 0
    ? `D+${Math.abs(daysUntilExpiration)}`
    : `D-${daysUntilExpiration}`;
}

export function formatExpirationDeadline(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return `${year}년 ${month}월 ${day}일까지`;
}
