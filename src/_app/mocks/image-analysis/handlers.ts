import { http, HttpResponse } from "msw";

import type {
  ImageAnalysis,
  ImageAnalysisImageResult,
  ImageAnalysisStatus,
} from "@/entities/image";
import { getTodayInSeoul } from "@/shared/lib/seoul-date";

import { emitMockEvent } from "../event-stream";
import { mockProblem, mockSuccess } from "../recommendation/handlers";

const IMAGE_DONE_MS = 1_500;

function date(days: number) {
  return new Date(Date.parse(getTodayInSeoul()) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}

function productResult(imageObjectKey: string): ImageAnalysisImageResult {
  return {
    imageObjectKey,
    status: "COMPLETED",
    recognitionStatus: "AI_ESTIMATED",
    documentType: "PRODUCT",
    items: [
      {
        itemId: `${imageObjectKey}-1`,
        displayStatus: "RECOGNIZED",
        name: "두부",
        category: "TOFU_BEAN",
        storageType: "REFRIGERATED",
        measureType: "COUNT",
        quantity: 1,
        weight: { value: null, unit: "NONE" },
        expiration: { date: date(5), dateType: "USE_BY", estimatedRange: null },
        reviewReasons: [],
      },
      {
        itemId: `${imageObjectKey}-2`,
        displayStatus: "AI_ESTIMATED",
        name: "애호박",
        category: "VEGETABLE",
        storageType: "REFRIGERATED",
        measureType: "COUNT",
        quantity: 1,
        weight: { value: null, unit: "NONE" },
        expiration: {
          date: null,
          dateType: "ESTIMATED_CONSUMPTION_WINDOW",
          estimatedRange: { from: date(3), to: date(7) },
        },
        reviewReasons: [
          {
            field: "EXPIRATION",
            code: "EXPIRATION_ESTIMATED",
            messages: [
              "표시된 소비기한이 없어 보관 조건을 기준으로 예상했습니다.",
            ],
          },
        ],
      },
    ],
    error: null,
  };
}

function failedResult(imageObjectKey: string): ImageAnalysisImageResult {
  return {
    imageObjectKey,
    status: "FAILED",
    recognitionStatus: null,
    documentType: null,
    items: [],
    error: {
      code: "MODEL_UNAVAILABLE",
      message:
        "이미지 분석을 완료하지 못했습니다. 직접 입력하거나 잠시 후 다시 시도해 주세요.",
      retryable: true,
      retryAfterMs: 30000,
    },
  };
}

function toListItem(analysis: ImageAnalysis) {
  const { results, ...rest } = analysis;
  return {
    ...rest,
    totalImageCount: results.length,
    completedImageCount: results.filter((r) => r.status === "COMPLETED").length,
    failedImageCount: results.filter((r) => r.status === "FAILED").length,
    images: results.map((r) => ({
      imageObjectKey: r.imageObjectKey,
      status: r.status,
      itemCount: r.status === "COMPLETED" ? r.items.length : null,
    })),
  };
}

export function createImageAnalysisHandlers() {
  const analyses = new Map<string, ImageAnalysis>();
  let sequence = 0;

  function finishImage(
    analysis: ImageAnalysis,
    index: number,
    scenario: string,
  ) {
    const key = analysis.results[index].imageObjectKey;
    const fails =
      scenario === "FAILED" ||
      (scenario === "PARTIALLY_COMPLETED" && index > 0);
    analysis.results[index] = fails ? failedResult(key) : productResult(key);
    const done = analysis.results.every(
      (r) => r.status === "COMPLETED" || r.status === "FAILED",
    );
    const failedCount = analysis.results.filter(
      (r) => r.status === "FAILED",
    ).length;
    const counts = {
      totalImageCount: analysis.results.length,
      completedImageCount: analysis.results.filter(
        (r) => r.status === "COMPLETED",
      ).length,
      failedImageCount: failedCount,
    };
    emitMockEvent("image-analysis.image-finished", {
      analysisId: analysis.analysisId,
      imageObjectKey: key,
      imageStatus: analysis.results[index].status,
      ...counts,
      expiresAt: null,
    });
    if (!done) return;
    const status: ImageAnalysisStatus =
      failedCount === 0
        ? "COMPLETED"
        : failedCount === analysis.results.length
          ? "FAILED"
          : "PARTIALLY_COMPLETED";
    Object.assign(analysis, {
      status,
      pollAfterMs: null,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    emitMockEvent("image-analysis.finished", {
      analysisId: analysis.analysisId,
      status,
      ...counts,
      expiresAt: analysis.expiresAt,
    });
  }

  return [
    http.post("*/api/v1/image/presigned-url", ({ request, cookies }) => {
      if (!cookies.imageAnalysisMock) return;
      sequence += 1;
      return mockSuccess("IMAGE-200-001", {
        objectKey: `mock-image-${sequence}`,
        uploadUrl: new URL(`/mock-upload/${sequence}`, request.url).href,
        method: "PUT",
        headers: {},
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      });
    }),
    http.put("*/mock-upload/:key", () => new HttpResponse(null)),
    http.post("*/api/v1/image-analyses", async ({ request, cookies }) => {
      if (!cookies.imageAnalysisMock) return;
      const body = (await request.json().catch(() => null)) as {
        imageObjectKeys?: string[];
      } | null;
      const keys = body?.imageObjectKeys ?? [];
      if (keys.length === 0) return mockProblem(400, "GLOBAL-400-001");
      const analysis: ImageAnalysis = {
        analysisId: crypto.randomUUID(),
        status: "PROCESSING",
        submittedAt: new Date().toISOString(),
        expiresAt: null,
        pollAfterMs: 1000,
        results: keys.map((imageObjectKey) => ({
          imageObjectKey,
          status: "PROCESSING",
          recognitionStatus: null,
          documentType: null,
          items: [],
          error: null,
        })),
        error: null,
      };
      analyses.set(analysis.analysisId, analysis);
      keys.forEach((_, index) =>
        setTimeout(
          () => finishImage(analysis, index, cookies.imageAnalysisMock),
          IMAGE_DONE_MS * (index + 1),
        ),
      );
      const { analysisId, status, submittedAt, expiresAt, pollAfterMs } =
        analysis;
      return mockSuccess(
        "IMAGE-202-001",
        { analysisId, status, submittedAt, expiresAt, pollAfterMs },
        202,
      );
    }),
    http.get("*/api/v1/image-analyses", ({ cookies }) => {
      if (!cookies.imageAnalysisMock) return;
      return mockSuccess("IMAGE-200-003", {
        analyses: [...analyses.values()].reverse().map(toListItem),
      });
    }),
    http.get("*/api/v1/image-analyses/:analysisId", ({ params, cookies }) => {
      if (!cookies.imageAnalysisMock) return;
      const analysis = analyses.get(String(params.analysisId));
      return analysis
        ? mockSuccess("IMAGE-200-002", analysis)
        : mockProblem(404, "IMAGE-404-001");
    }),
    http.delete(
      "*/api/v1/image-analyses/:analysisId",
      ({ params, cookies }) => {
        if (!cookies.imageAnalysisMock) return;
        analyses.delete(String(params.analysisId));
        return new HttpResponse(null, { status: 204 });
      },
    ),
  ];
}
