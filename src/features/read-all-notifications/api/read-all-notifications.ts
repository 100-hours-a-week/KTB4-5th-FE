import { requestNoContent } from "@/shared/api";

export function readAllNotifications(refrigeratorId: string): Promise<void> {
  return requestNoContent(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/notifications/read-all`,
    { method: "PATCH" },
  );
}
