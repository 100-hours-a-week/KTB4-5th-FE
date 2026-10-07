import { requestJson } from "@/shared/api";

export type ImageAnalysisStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "FAILED";

export type ImageAnalysisSubmission = {
  analysisId: string;
  status: ImageAnalysisStatus;
  submittedAt: string;
  expiresAt: string;
  pollAfterMs: number;
};

export async function requestImageAnalysis(
  imageObjectKeys: string[],
): Promise<ImageAnalysisSubmission> {
  const { data } = await requestJson<ImageAnalysisSubmission>(
    "/image-analyses",
    {
      method: "POST",
      json: { imageObjectKeys, inputHint: "AUTO" },
    },
  );
  return data;
}
