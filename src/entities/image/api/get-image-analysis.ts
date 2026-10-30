import { requestJson } from "@/shared/api";

import type { ImageAnalysisStatus } from "./request-image-analysis";

export type ImageAnalysisDisplayStatus =
  "RECOGNIZED" | "UNRECOGNIZED" | "NEEDS_REVIEW" | "AI_ESTIMATED";

export type ImageAnalysisReviewReason = {
  field: string;
  code: string;
  messages: string[];
};

export type ImageAnalysisExpiration = {
  date: string | null;
  dateType: "USE_BY" | "ESTIMATED_CONSUMPTION_WINDOW" | "UNKNOWN";
  estimatedRange: { from: string; to: string } | null;
};

export type ImageAnalysisItem = {
  itemId: string;
  displayStatus: ImageAnalysisDisplayStatus;
  name: string | null;
  category: string | null;
  storageType: string | null;
  measureType: string | null;
  quantity: number | null;
  weight: { value: number | null; unit: string | null } | null;
  expiration: ImageAnalysisExpiration | string | null;
  reviewReasons: ImageAnalysisReviewReason[];
};

export type ImageAnalysisError = {
  code: string;
  message: string;
  retryable: boolean;
  retryAfterMs: number | null;
};

export type ImageAnalysisImageResult = {
  imageObjectKey: string;
  status: ImageAnalysisStatus;
  recognitionStatus: ImageAnalysisDisplayStatus | null;
  documentType: "RECEIPT" | "PRODUCT" | null;
  items: ImageAnalysisItem[];
  error: ImageAnalysisError | null;
};

export type ImageAnalysis = {
  analysisId: string;
  status: ImageAnalysisStatus;
  submittedAt: string;
  expiresAt: string | null;
  pollAfterMs: number | null;
  results: ImageAnalysisImageResult[];
  error: ImageAnalysisError | null;
};

type GetImageAnalysisParams = {
  analysisId: string;
  signal?: AbortSignal;
};

export async function getImageAnalysis({
  analysisId,
  signal,
}: GetImageAnalysisParams): Promise<ImageAnalysis> {
  const { data } = await requestJson<ImageAnalysis>(
    `/image-analyses/${encodeURIComponent(analysisId)}`,
    { signal },
  );
  return data;
}
