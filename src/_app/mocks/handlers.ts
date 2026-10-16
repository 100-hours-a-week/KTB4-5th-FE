import { http, HttpResponse } from "msw";

import type { ApiResponse } from "@/shared/api";

import { notificationHandlers } from "./notification-handlers";
import { userHandlers } from "./user-handlers";

export const handlers = [
  http.get("*/api/v1/mock/health", () =>
    HttpResponse.json<ApiResponse<{ status: string }>>({
      code: "MOCK-200-001",
      message: "OK",
      data: { status: "ok" },
    }),
  ),
  ...userHandlers,
  ...notificationHandlers,
];
