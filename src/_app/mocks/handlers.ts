import { http, HttpResponse } from "msw";

import type { ApiResponse } from "@/shared/api";
import { mockEventStreamHandler } from "./event-stream";
import { createImageAnalysisHandlers } from "./image-analysis/handlers";
import { createRecommendationHandlers } from "./recommendation/handlers";

export const handlers = [
  mockEventStreamHandler,
  ...createImageAnalysisHandlers(),
  ...createRecommendationHandlers(),
  http.get("*/api/v1/mock/health", () =>
    HttpResponse.json<ApiResponse<{ status: string }>>({
      code: "MOCK-200-001",
      message: "OK",
      data: { status: "ok" },
    }),
  ),
];
