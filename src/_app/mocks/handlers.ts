import { http, HttpResponse } from "msw";

import type { ApiResponse } from "@/shared/api";

import { imageAnalysisHandlers } from "./image-analysis-handlers";

export const handlers = [
  http.get("*/api/v1/mock/health", () =>
    HttpResponse.json<ApiResponse<{ status: string }>>({
      code: "MOCK-200-001",
      message: "OK",
      data: { status: "ok" },
    }),
  ),
  ...imageAnalysisHandlers,
];
