import { http, HttpResponse } from "msw";

import type {
  ImageAnalysis,
  ImageAnalysisImageResult,
  ImageAnalysisItem,
  ImageAnalysisStatus,
  ImageAnalysisSubmission,
} from "@/entities/image";
import type { ApiResponse } from "@/shared/api";

type Scenario = "default" | "fail" | "partial" | "over";

type MockAnalysis = {
  imageObjectKeys: string[];
  scenario: Scenario;
  submittedAt: Date;
};

const QUEUED_MS = 1000;
const PROCESSING_MS = 4000;
const POLL_AFTER_MS = 1000;
const SCENARIOS: readonly Scenario[] = ["fail", "partial", "over"];

const analyses = new Map<string, MockAnalysis>();

function readScenario(): Scenario {
  const value = new URLSearchParams(globalThis.location?.search).get("ocr");
  return SCENARIOS.find((scenario) => scenario === value) ?? "default";
}

function daysFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

function item(
  index: number,
  overrides: Partial<ImageAnalysisItem>,
): ImageAnalysisItem {
  return {
    itemId: `item_${index}`,
    displayStatus: "RECOGNIZED",
    name: null,
    category: null,
    storageType: { value: "REFRIGERATED", confidence: 1 },
    measureType: "COUNT",
    quantity: 1,
    weight: null,
    expiration: { date: daysFromToday(7), confidence: 0.9 },
    reviewReasons: [],
    ...overrides,
  };
}

function createItems(scenario: Scenario): ImageAnalysisItem[] {
  if (scenario === "over") {
    const names = [
      "양파",
      "감자",
      "당근",
      "오이",
      "애호박",
      "버섯",
      "상추",
      "깻잎",
    ];
    return Array.from({ length: 23 }, (_, index) =>
      item(index, {
        name: {
          value: `${names[index % names.length]}${Math.floor(index / names.length) + 1}`,
          confidence: 0.9,
        },
        category: { value: "VEGETABLE", confidence: 0.9 },
      }),
    );
  }

  return [
    item(0, {
      name: { value: "서울우유 나100", confidence: 0.94 },
      category: { value: "DAIRY", confidence: 0.99 },
      measureType: "WEIGHT",
      quantity: null,
      weight: { value: 1000, unit: "ML", confidence: 0.96 },
      expiration: null,
      reviewReasons: ["소비기한을 직접 확인해 주세요."],
      displayStatus: "NEEDS_REVIEW",
    }),
    item(1, {
      name: { value: "두부", confidence: 0.78 },
      category: { value: "TOFU_BEAN", confidence: 0.85 },
      quantity: 2,
      expiration: { date: daysFromToday(5), confidence: 0.6 },
      displayStatus: "NEEDS_REVIEW",
    }),
    item(2, {
      name: { value: "계란", confidence: 0.95 },
      category: { value: "DAIRY", confidence: 0.9 },
      quantity: 10,
      expiration: { date: daysFromToday(14), confidence: 0.5 },
      displayStatus: "AI_ESTIMATED",
    }),
    item(3, {
      name: { value: "대파", confidence: 0.92 },
      category: { value: "VEGETABLE", confidence: 0.95 },
      quantity: 3,
    }),
  ];
}

function failedResult(imageObjectKey: string): ImageAnalysisImageResult {
  return {
    imageObjectKey,
    status: "FAILED",
    recognitionStatus: null,
    items: [],
    error: {
      code: "MODEL_UNAVAILABLE",
      message: "이미지 분석을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      retryable: true,
      retryAfterMs: 30000,
    },
  };
}

function createDoneResults({ imageObjectKeys, scenario }: MockAnalysis) {
  if (scenario === "fail") return imageObjectKeys.map(failedResult);

  const items = createItems(scenario);
  const readableKeys =
    scenario === "partial" && imageObjectKeys.length > 1
      ? imageObjectKeys.slice(0, -1)
      : imageObjectKeys;

  return imageObjectKeys.map((imageObjectKey, imageIndex) => {
    if (imageIndex >= readableKeys.length) return failedResult(imageObjectKey);

    const imageItems = items.filter(
      (_, index) => index % readableKeys.length === imageIndex,
    );
    return {
      imageObjectKey,
      status: "COMPLETED",
      recognitionStatus: imageItems.length > 0 ? "RECOGNIZED" : "UNRECOGNIZED",
      items: imageItems,
      error: null,
    } satisfies ImageAnalysisImageResult;
  });
}

function toDoneStatus(
  results: ImageAnalysisImageResult[],
): ImageAnalysisStatus {
  const failedCount = results.filter(
    (result) => result.status === "FAILED",
  ).length;
  if (failedCount === results.length) return "FAILED";
  return failedCount > 0 ? "PARTIALLY_COMPLETED" : "COMPLETED";
}

function toResponse(analysisId: string, analysis: MockAnalysis): ImageAnalysis {
  const elapsed = Date.now() - analysis.submittedAt.getTime();
  const expiresAt = new Date(analysis.submittedAt.getTime() + 86_400_000);
  const base = {
    analysisId,
    submittedAt: analysis.submittedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    error: null,
  };

  if (elapsed < PROCESSING_MS) {
    const status = elapsed < QUEUED_MS ? "QUEUED" : "PROCESSING";
    return {
      ...base,
      status,
      pollAfterMs: POLL_AFTER_MS,
      results: analysis.imageObjectKeys.map((imageObjectKey) => ({
        imageObjectKey,
        status,
        recognitionStatus: null,
        items: [],
        error: null,
      })),
    };
  }

  const results = createDoneResults(analysis);
  return { ...base, status: toDoneStatus(results), pollAfterMs: null, results };
}

export const imageAnalysisHandlers = [
  http.post<never, { imageObjectKeys: string[] }>(
    "*/api/v1/image-analyses",
    async ({ request }) => {
      const { imageObjectKeys } = await request.json();
      const analysisId = `ana_${analyses.size + 1}`;
      const analysis = {
        imageObjectKeys,
        scenario: readScenario(),
        submittedAt: new Date(),
      };
      analyses.set(analysisId, analysis);

      return HttpResponse.json<ApiResponse<ImageAnalysisSubmission>>(
        {
          code: "REFRIGERATOR-202-016",
          message: "이미지 인식 시작",
          data: {
            analysisId,
            status: "QUEUED",
            submittedAt: analysis.submittedAt.toISOString(),
            expiresAt: toResponse(analysisId, analysis).expiresAt,
            pollAfterMs: POLL_AFTER_MS,
          },
        },
        { status: 202 },
      );
    },
  ),
  http.get<{ analysisId: string }>(
    "*/api/v1/image-analyses/:analysisId",
    ({ params }) => {
      const analysis = analyses.get(params.analysisId);
      if (!analysis) {
        return HttpResponse.json(
          { code: "IMAGE-404-001", message: "조회 대상을 찾을 수 없습니다." },
          {
            status: 404,
            headers: { "Content-Type": "application/problem+json" },
          },
        );
      }

      return HttpResponse.json<ApiResponse<ImageAnalysis>>({
        code: "IMAGE-200-002",
        message: "이미지 인식 결과 조회 성공",
        data: toResponse(params.analysisId, analysis),
      });
    },
  ),
];
