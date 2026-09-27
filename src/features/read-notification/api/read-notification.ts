import { requestNoContent } from "@/shared/api";

export function readNotification(notificationId: string): Promise<void> {
  return requestNoContent(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH" },
  );
}
