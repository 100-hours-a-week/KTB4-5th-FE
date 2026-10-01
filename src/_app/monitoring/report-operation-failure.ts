import * as Sentry from "@sentry/nextjs";

import { ApiError, SessionExpiredError } from "@/shared/api";

const operations = {
  "ingredient.list": {
    feature: "ingredient",
    method: "GET",
    route: "/refrigerators/[refrigeratorId]/ingredients",
  },
  "ingredient.detail": {
    feature: "ingredient",
    method: "GET",
    route: "/ingredients/[ingredientId]",
  },
  "ingredient.register": {
    feature: "ingredient",
    method: "POST",
    route: "/refrigerators/[refrigeratorId]/ingredients",
  },
  "notification.list": {
    feature: "notification",
    method: "GET",
    route: "/refrigerators/[refrigeratorId]/notifications",
  },
  "notification.stream": {
    feature: "notification",
    method: "GET",
    route: "/refrigerators/[refrigeratorId]/notifications/stream",
  },
  "notification.unreadCount": {
    feature: "notification",
    method: "GET",
    route: "/refrigerators/[refrigeratorId]/notifications/unread-count",
  },
  "notification.preferences": {
    feature: "notification",
    method: "GET",
    route: "/notifications/settings",
  },
  "notification.read": {
    feature: "notification",
    method: "PATCH",
    route: "/notifications/[notificationId]/read",
  },
  "notification.readAll": {
    feature: "notification",
    method: "PATCH",
    route: "/refrigerators/[refrigeratorId]/notifications/read-all",
  },
  "push.register": {
    feature: "push",
    method: "POST",
    route: "/push-subscriptions",
  },
  "push.resubscribe": {
    feature: "push",
    method: "GET/POST",
    route: "/notifications/settings -> /push-subscriptions",
  },
  "push.disable": {
    feature: "push",
    method: "DELETE",
    route: "/push-subscriptions/[subscriptionId]",
  },
} as const;

type Operation = keyof typeof operations;

function isOperation(value: unknown): value is Operation {
  return typeof value === "string" && Object.hasOwn(operations, value);
}

function safeServiceCode(code: string): string {
  return /^[A-Z][A-Z0-9_]*-\d{3}-\d{3}$/.test(code) ? code : "UNKNOWN";
}

function readPushFailure(error: unknown): {
  step: "key" | "subscribe" | "register";
  status?: number;
  code?: string;
} | null {
  if (
    !(error instanceof Error) ||
    error.name !== "PushRegistrationFailure" ||
    !("step" in error) ||
    (error.step !== "key" &&
      error.step !== "subscribe" &&
      error.step !== "register")
  ) {
    return null;
  }

  return {
    step: error.step,
    status:
      "status" in error && typeof error.status === "number"
        ? error.status
        : undefined,
    code:
      "code" in error && typeof error.code === "string"
        ? error.code
        : undefined,
  };
}

export function reportOperationFailure(error: unknown, meta: unknown): void {
  const operation =
    typeof meta === "object" && meta !== null && "monitoringOperation" in meta
      ? meta.monitoringOperation
      : undefined;

  if (!isOperation(operation) || error instanceof SessionExpiredError) {
    return;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return;
  }

  const pushFailure =
    operation === "push.register" || operation === "push.resubscribe"
      ? readPushFailure(error)
      : null;
  const statusNumber =
    error instanceof ApiError ? error.status : pushFailure?.status;

  // 재시도 후에도 실패한 푸시 구독은 4xx여도 기기 설정 불일치일 수 있다.
  if (statusNumber !== undefined && statusNumber < 500 && !pushFailure) {
    return;
  }

  const definition = operations[operation];
  const failureType =
    statusNumber !== undefined
      ? "api"
      : error instanceof TypeError
        ? "network_or_contract"
        : pushFailure
          ? "push"
          : "unexpected";
  const status = statusNumber === undefined ? undefined : String(statusNumber);
  const rawCode = error instanceof ApiError ? error.code : pushFailure?.code;
  const code = rawCode === undefined ? undefined : safeServiceCode(rawCode);

  Sentry.withScope((scope) => {
    scope.setTags({
      feature: definition.feature,
      operation,
      failure_type: failureType,
      ...(pushFailure ? { push_step: pushFailure.step } : {}),
      ...(status ? { http_status: status } : {}),
      ...(code ? { service_code: code } : {}),
    });
    scope.setContext("operation", {
      method: definition.method,
      route: definition.route,
      failureType,
      step: pushFailure?.step,
      status,
      code,
    });
    scope.setFingerprint([
      operation,
      failureType,
      pushFailure?.step ?? "none",
      status ?? "none",
      code ?? "none",
    ]);
    scope.setLevel("error");
    // ApiError.problem과 원본 Error.message에는 사용자 데이터가 들어갈 수 있다.
    Sentry.captureException(new Error(`${operation} failed (${failureType})`));
  });
}
