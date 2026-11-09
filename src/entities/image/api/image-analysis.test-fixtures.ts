import type { ImageAnalysis } from "./get-image-analysis";
import type { ImageAnalysisListItem } from "./get-image-analysis-list";

export const analysisFixture: ImageAnalysis & ImageAnalysisListItem = {
  analysisId: "analysis-1",
  status: "PARTIALLY_COMPLETED",
  submittedAt: "2026-10-16T18:59:00+09:00",
  expiresAt: "2026-10-23T19:00:00+09:00",
  pollAfterMs: null,
  totalImageCount: 2,
  completedImageCount: 1,
  failedImageCount: 1,
  images: [
    { imageObjectKey: "receipt.jpg", status: "COMPLETED", itemCount: 1 },
    { imageObjectKey: "blur.jpg", status: "FAILED", itemCount: 0 },
  ],
  results: [
    {
      imageObjectKey: "receipt.jpg",
      status: "COMPLETED",
      recognitionStatus: "NEEDS_REVIEW",
      documentType: "RECEIPT",
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

export const productAnalysisFixture: ImageAnalysis & ImageAnalysisListItem = {
  ...analysisFixture,
  analysisId: "product-analysis-1",
  status: "COMPLETED",
  totalImageCount: 1,
  completedImageCount: 1,
  failedImageCount: 0,
  images: [
    { imageObjectKey: "product.jpg", status: "COMPLETED", itemCount: 1 },
  ],
  results: [
    {
      ...analysisFixture.results[0],
      imageObjectKey: "product.jpg",
      documentType: "PRODUCT",
      recognitionStatus: "AI_ESTIMATED",
      items: [
        {
          ...analysisFixture.results[0].items[0],
          displayStatus: "AI_ESTIMATED",
          expiration: {
            date: null,
            dateType: "ESTIMATED_CONSUMPTION_WINDOW",
            estimatedRange: { from: "2026-11-03", to: "2026-11-07" },
          },
          reviewReasons: [
            {
              field: "EXPIRATION",
              code: "EXPIRATION_ESTIMATED",
              messages: ["보관 조건에 따른 예상 기한입니다."],
            },
          ],
        },
      ],
    },
  ],
};
