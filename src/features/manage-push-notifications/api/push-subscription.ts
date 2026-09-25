import { requestJson } from "@/shared/api";

type VapidPublicKeyResponse = {
  vapidPublicKey: string;
};

export type RegisterPushSubscriptionRequest = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type RegisterPushSubscriptionResponse = {
  subscriptionId: string;
};

export const PUSH_ENDPOINT_IN_USE_ERROR_CODE = "PUSH-409-001";

export async function getVapidPublicKey(): Promise<string> {
  const { data } = await requestJson<VapidPublicKeyResponse>(
    "/push-subscriptions/vapid-public-key",
  );

  return data.vapidPublicKey;
}

export async function registerPushSubscription(
  request: RegisterPushSubscriptionRequest,
): Promise<string> {
  const { data } = await requestJson<RegisterPushSubscriptionResponse>(
    "/push-subscriptions",
    { method: "POST", json: request },
  );

  return data.subscriptionId;
}
