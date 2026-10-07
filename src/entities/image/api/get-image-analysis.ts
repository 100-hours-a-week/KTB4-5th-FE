import { requestJson } from "@/shared/api";

import type { ImageAnalysisStatus } from "./request-image-analysis";

export type ImageAnalysisDisplayStatus =
  | "RECOGNIZED"
  | "UNRECOGNIZED"
  | "NEEDS_REVIEW"
  | "AI_ESTIMATED";

type ScoredValue<T> = { value: T; confidence: number } | null;

export type ImageAnalysisItem = {
  itemId: string;
  displayStatus: ImageAnalysisDisplayStatus;
  name: ScoredValue<string>;
  category: ScoredValue<string>;
  storageType: ScoredValue<string>;
  measureType: string | null;
  quantity: number | null;
  weight: { value: number; unit: string; confidence: number } | null;
  expiration: { date: string; confidence: number } | null;
  reviewReasons: string[];
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
  recognitionStatus: "RECOGNIZED" | "UNRECOGNIZED" | null;
  items: ImageAnalysisItem[];
  error: ImageAnalysisError | null;
};

export type ImageAnalysis = {
  analysisId: string;
  status: ImageAnalysisStatus;
  submittedAt: string;
  expiresAt: string;
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
