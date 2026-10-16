import type { ImageAnalysisListItem } from "./get-image-analysis-list";

export const analysisFixture: ImageAnalysisListItem = {
  analysisId: "analysis-1",
  status: "PARTIALLY_COMPLETED",
  submittedAt: "2026-10-16T18:59:00+09:00",
  expiresAt: "2026-10-23T19:00:00+09:00",
  pollAfterMs: null,
  totalImageCount: 2,
  completedImageCount: 1,
  failedImageCount: 1,
  results: [
    {
      imageObjectKey: "receipt.jpg",
      status: "COMPLETED",
      recognitionStatus: "NEEDS_REVIEW",
      documentType: "RECEIPT",
      itemCount: 1,
      items: [
        {
          itemId: "item_001",
          displayStatus: "NEEDS_REVIEW",
          name: "우유",
          category: "DAIRY",
          storageType: "REFRIGERATED",
          measureType: "WEIGHT",
          quantity: null,
          weight: { value: 1000, unit: "ML" },
          expiration: null,
          reviewReasons: [
            {
              field: "EXPIRATION",
              code: "EXPIRATION_NOT_FOUND",
              messages: ["소비기한을 직접 확인해 주세요."],
            },
          ],
        },
      ],
      error: null,
    },
    {
      imageObjectKey: "blur.jpg",
      status: "FAILED",
      recognitionStatus: null,
      documentType: null,
      itemCount: 0,
      items: [],
      error: {
        code: "MODEL_UNAVAILABLE",
        message: "다시 시도해 주세요.",
        retryable: true,
        retryAfterMs: 30000,
      },
    },
  ],
  error: null,
};
