import { requestNoContent } from "@/shared/api";

export function deletePushSubscription(subscriptionId: string): Promise<void> {
  return requestNoContent(
    `/push-subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: "DELETE" },
  );
}
