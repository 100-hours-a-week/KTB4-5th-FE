import type { ImageAnalysisListItem } from "@/entities/image";

// API가 최근 접수 순으로 반환하므로 첫 번째 유효 작업을 보여준다.
export function selectAnalysisBanner(
  analyses: readonly ImageAnalysisListItem[],
  now: number,
  registeredIds: readonly string[] = [],
) {
  return analyses.find(
    (analysis) =>
      !registeredIds.includes(analysis.analysisId) &&
      (analysis.expiresAt === null || Date.parse(analysis.expiresAt) > now),
  );
}
