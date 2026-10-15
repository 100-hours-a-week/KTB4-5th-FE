export function getNotificationEventsUrl(refrigeratorId: string): string {
  return `/api/v2/refrigerators/${encodeURIComponent(refrigeratorId)}/notifications/stream`;
}
