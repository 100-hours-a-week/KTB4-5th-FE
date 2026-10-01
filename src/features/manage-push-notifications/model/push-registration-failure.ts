import { ApiError } from "@/shared/api";

import type { RegisterWebPushResult } from "./push-notification-subscription";

export class PushRegistrationFailure extends Error {
  readonly step: "key" | "subscribe" | "register";
  readonly status?: number;
  readonly code?: string;

  constructor(result: Extract<RegisterWebPushResult, { status: "error" }>) {
    super("푸시 구독에 실패했습니다.");
    this.name = "PushRegistrationFailure";
    this.step = result.step;

    if (result.cause instanceof ApiError) {
      this.status = result.cause.status;
      this.code = result.cause.code;
    }
  }
}
