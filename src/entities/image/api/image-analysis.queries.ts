import { queryOptions } from "@tanstack/react-query";
import { ApiError, SessionExpiredError } from "@/shared/api";

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
  detail: (analysisId: string) =>
    queryOptions({
      meta: { monitoringOperation: "image.analysis.detail" },
      queryKey: [...imageAnalysisQueries.all(), analysisId] as const,
      queryFn: ({ signal }) => getImageAnalysis({ analysisId, signal }),
      staleTime: Infinity,
      retry: retryImageAnalysisRead,
      refetchInterval: (query) =>
        query.state.status === "error"
          ? false
          : (query.state.data?.pollAfterMs ?? false),
      refetchIntervalInBackground: false,
    }),
};
