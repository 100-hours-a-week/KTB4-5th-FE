import { queryOptions } from "@tanstack/react-query";
import { ApiError, SessionExpiredError } from "@/shared/api";

import { getImageAnalysisList } from "./get-image-analysis-list";

import { getImageAnalysis } from "./get-image-analysis";

function retryImageAnalysisRead(failureCount: number, error: Error): boolean {
  return (
    !(error instanceof SessionExpiredError) &&
    !(error instanceof ApiError && error.status < 500) &&
    failureCount < 2
  );
}

export const imageAnalysisQueries = {
  all: () => ["image-analyses"] as const,
  lists: () => [...imageAnalysisQueries.all(), "list"] as const,
  list: (userScope: string) =>
    queryOptions({
      meta: { monitoringOperation: "image.analysis.list" },
      queryKey: [...imageAnalysisQueries.lists(), userScope] as const,
      queryFn: ({ signal }) => getImageAnalysisList({ signal }),
      staleTime: 0,
      retry: retryImageAnalysisRead,
    }),
  detail: (analysisId: string) =>
    queryOptions({
      meta: { monitoringOperation: "image.analysis.detail" },
      queryKey: [...imageAnalysisQueries.all(), analysisId] as const,
      queryFn: ({ signal }) => getImageAnalysis({ analysisId, signal }),
      staleTime: Infinity,
      retry: retryImageAnalysisRead,
    }),
};
