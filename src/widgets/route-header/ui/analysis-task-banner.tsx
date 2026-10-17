"use client";

import { XmarkOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  imageAnalysisQueries,
  useDeleteImageAnalysis,
  useRegisteredAnalyses,
} from "@/entities/image";
import { useNotificationSessionScope } from "@/entities/notification";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";
import { AppLink } from "@/shared/ui/app-link";
import { showAppToast } from "@/shared/ui/app-toast";

import {
  markExpiringNoticeSeen,
  readSeenExpiringNotices,
} from "../model/expiring-notice-seen";
import { selectAnalysisBanner } from "../model/select-analysis-banner";
import { AnalysisBanner } from "./analysis-banner";

const MINUTE_MS = 60_000;
const EXPIRING_SOON_MS = 60 * MINUTE_MS;

export function AnalysisTaskBanner() {
  const userScope = useNotificationSessionScope();
  const pathname = usePathname();
  const registeredIds = useRegisteredAnalyses((state) =>
    userScope ? state.idsBySession[userScope] : undefined,
  );
  const [now, setNow] = useState(() => Date.now());
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [seenExpiringNotices] = useState(readSeenExpiringNotices);
  const removeAnalysis = useDeleteImageAnalysis();
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

  const msLeft = analysis?.expiresAt
    ? Date.parse(analysis.expiresAt) - now
    : Infinity;
  const isHidden =
    !userScope ||
    !analysis ||
    pathname === routes.registerIngredientReceiptResult ||
    pathname === routes.registerIngredientReceipt;
  const isExpiring =
    !isHidden &&
    analysis.status !== "QUEUED" &&
    analysis.status !== "PROCESSING" &&
    msLeft <= EXPIRING_SOON_MS &&
    !seenExpiringNotices.includes(analysis.analysisId);

  useEffect(() => {
    if (isExpiring && analysis) markExpiringNoticeSeen(analysis.analysisId);
  }, [isExpiring, analysis]);

  useEffect(() => {
    if (msLeft === Infinity) return;
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      msLeft > EXPIRING_SOON_MS ? msLeft - EXPIRING_SOON_MS : MINUTE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [msLeft]);

  if (isHidden) return null;

  const isFinished =
    analysis.status !== "QUEUED" && analysis.status !== "PROCESSING";

  return (
    <div className="relative flex-none">
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
            : isExpiring
              ? {
                  status: "expiring",
                  minutesLeft: Math.max(Math.ceil(msLeft / MINUTE_MS), 1),
                }
              : {
                  status:
                    analysis.status === "FAILED"
                      ? "failed"
                      : analysis.status === "PARTIALLY_COMPLETED"
                        ? "partial"
                        : "completed",
                })}
          closable={isFinished}
        />
      </AppLink>
      {isFinished ? (
        <button
          type="button"
          aria-label="인식 결과 닫기"
          onClick={() => setIsConfirmingClose(true)}
          className="absolute top-0 right-[calc(var(--space-4)+var(--safe-right)+35px)] grid size-12 cursor-pointer place-items-center border-0 bg-transparent p-0 text-app-ink/60"
        >
          <Lineicons
            icon={XmarkOutlined}
            size={16}
            strokeWidth={2}
            aria-hidden="true"
            focusable="false"
          />
        </button>
      ) : null}
      <AppDialog
        open={isConfirmingClose}
        title="인식 결과를 지울까요?"
        description="배너를 닫으면 인식 결과가 삭제돼요. 삭제한 결과는 다시 볼 수 없어요."
        secondaryAction={{
          label: "취소",
          onClick: () => setIsConfirmingClose(false),
          disabled: removeAnalysis.isPending,
        }}
        primaryAction={{
          label: "삭제하기",
          disabled: removeAnalysis.isPending,
          onClick: () =>
            removeAnalysis.mutate(analysis.analysisId, {
              onSuccess: () => setIsConfirmingClose(false),
              onError: () =>
                showAppToast({
                  message: "인식 결과를 지우지 못했어요. 다시 시도해 주세요",
                  variant: "error",
                }),
            }),
        }}
      />
    </div>
  );
}
