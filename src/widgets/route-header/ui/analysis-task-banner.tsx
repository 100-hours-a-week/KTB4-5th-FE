"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { imageAnalysisQueries, useRegisteredAnalyses } from "@/entities/image";
import { useNotificationSessionScope } from "@/entities/notification";
import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";

import { selectAnalysisBanner } from "../model/select-analysis-banner";
import { AnalysisBanner } from "./analysis-banner";

export function AnalysisTaskBanner() {
  const userScope = useNotificationSessionScope();
  const pathname = usePathname();
  const registeredIds = useRegisteredAnalyses((state) =>
    userScope ? state.idsBySession[userScope] : undefined,
  );
  const [now, setNow] = useState(() => Date.now());
  const { data, refetch } = useQuery({
    ...imageAnalysisQueries.list(userScope ?? ""),
    enabled: Boolean(userScope),
  });
  const analysis = selectAnalysisBanner(
    data?.analyses ?? [],
    now,
    registeredIds,
  );

  useEffect(() => {
    if (!analysis?.expiresAt) return;
    const timer = window.setTimeout(
      () => {
        setNow(Date.now());
        void refetch();
      },
      Math.min(
        Math.max(Date.parse(analysis.expiresAt) - Date.now(), 0),
        2_147_483_647,
      ),
    );
    return () => window.clearTimeout(timer);
  }, [analysis?.analysisId, analysis?.expiresAt, refetch]);

  if (
    !userScope ||
    !analysis ||
    pathname === routes.registerIngredientReceiptResult
  )
    return null;

  return (
    <AppLink
      href={routes.imageAnalysisResult(analysis.analysisId)}
      className="block flex-none text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
    >
      <AnalysisBanner
        {...(analysis.status === "QUEUED" || analysis.status === "PROCESSING"
          ? {
              status: "processing",
              processedCount:
                analysis.completedImageCount + analysis.failedImageCount,
              totalCount: analysis.totalImageCount,
            }
          : {
              status:
                analysis.status === "FAILED"
                  ? "failed"
                  : analysis.status === "PARTIALLY_COMPLETED"
                    ? "partial"
                    : "completed",
            })}
      />
    </AppLink>
  );
}
