import { requestJson } from "@/shared/api";

import type {
  ImageAnalysis,
  ImageAnalysisImageResult,
} from "./get-image-analysis";

export type ImageAnalysisListItem = Omit<ImageAnalysis, "results"> & {
  totalImageCount: number;
  completedImageCount: number;
  failedImageCount: number;
  images: (Pick<ImageAnalysisImageResult, "imageObjectKey" | "status"> & {
    itemCount: number | null;
  })[];
};

export type ImageAnalysisList = { analyses: ImageAnalysisListItem[] };

export async function getImageAnalysisList({
  signal,
}: { signal?: AbortSignal } = {}): Promise<ImageAnalysisList> {
  const { data } = await requestJson<ImageAnalysisList>("/image-analyses", {
    signal,
  });
  return data;
}
