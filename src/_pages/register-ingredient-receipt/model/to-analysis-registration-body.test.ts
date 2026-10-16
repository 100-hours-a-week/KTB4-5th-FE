import { expect, it, vi } from "vitest";

import type { ImageAnalysis } from "@/entities/image";
import type { RegisterIngredientItem } from "@/entities/ingredient";

import {
  limitRecognitionResult,
  toRecognitionResult,
} from "./receipt-recognition";
import { toAnalysisRegistrationBody } from "./to-analysis-registration-body";

vi.mock("@/widgets/ingredient-draft-form", () => ({
  createEmptyDraft: () => ({
    category: "OTHER",
    name: "",
    storageType: "REFRIGERATED",
    quantity: "",
    weightValue: "",
    weightUnit: "G",
    expirationDate: "",
  }),
}));

const item: RegisterIngredientItem = {
  name: "수정한 우유",
  category: "OTHER",
  storageType: "REFRIGERATED",
  measureType: "WEIGHT",
  quantity: null,
  weightValue: 1000,
  weightUnit: "ML",
  expirationDate: "2026-10-20",
};

it("groups confirmed items by image and preserves original IDs after removal", () => {
  const origins = [
    { imageObjectKey: "a.jpg", itemId: "a1" },
    { imageObjectKey: "a.jpg", itemId: "a2" },
    { imageObjectKey: "b.jpg", itemId: "b1" },
    { imageObjectKey: "a.jpg", itemId: "a3" },
  ].filter((_, index) => index !== 1);
  const count = {
    ...item,
    measureType: "COUNT" as const,
    quantity: 2,
    weightValue: null,
    weightUnit: "NONE" as const,
  };
  const body = toAnalysisRegistrationBody("analysis-id", origins, [
    item,
    count,
    item,
  ]);
  const expectedItem = {
    itemId: "a1",
    name: "수정한 우유",
    category: "OTHER",
    storageType: "REFRIGERATED",
    measureType: "WEIGHT",
    quantity: null,
    weight: { value: 1000, unit: "ML" },
    expiration: "2026-10-20",
  };
  expect(body).toEqual({
    analysisId: "analysis-id",
    results: [
      {
        imageObjectKey: "a.jpg",
        items: [expectedItem, { ...expectedItem, itemId: "a3" }],
      },
      {
        imageObjectKey: "b.jpg",
        items: [
          {
            ...expectedItem,
            itemId: "b1",
            measureType: "COUNT",
            quantity: 2,
            weight: null,
          },
        ],
      },
    ],
  });
});

it("rejects missing origins and invalid weight units", () => {
  expect(() => toAnalysisRegistrationBody("id", [], [item])).toThrow();
  expect(() =>
    toAnalysisRegistrationBody(
      "id",
      [{ imageObjectKey: "a", itemId: "1" }],
      [{ ...item, weightUnit: "NONE" }],
    ),
  ).toThrow();
});

it("preserves analysis and item identities when limiting recognition results", () => {
  const analysis: ImageAnalysis = {
    analysisId: "analysis-id",
    status: "COMPLETED",
    submittedAt: "",
    expiresAt: "",
    pollAfterMs: null,
    error: null,
    results: [
      {
        imageObjectKey: "a.jpg",
        status: "COMPLETED",
        recognitionStatus: "RECOGNIZED",
        documentType: "RECEIPT",
        error: null,
        items: Array.from({ length: 21 }, (_, index) => ({
          itemId: String(index),
          displayStatus: "RECOGNIZED",
          name: "우유",
          category: "OTHER",
          storageType: "REFRIGERATED",
          measureType: "COUNT",
          quantity: 1,
          weight: null,
          expiration: "2026-10-20",
          reviewReasons: [],
        })),
      },
    ],
  };
  const result = limitRecognitionResult(toRecognitionResult(analysis));
  expect(result.analysisId).toBe("analysis-id");
  expect(result.drafts).toHaveLength(20);
  expect(result.origins).toHaveLength(20);
  expect(result.origins[19]).toEqual({ imageObjectKey: "a.jpg", itemId: "19" });
  expect(result.isTruncated).toBe(true);
});
