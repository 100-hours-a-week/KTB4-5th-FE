"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  imageAnalysisQueries,
  type ImageAnalysisStatus,
  requestImageAnalysis,
  uploadImage,
  useDeleteImageAnalysis,
  useRegisteredAnalyses,
} from "@/entities/image";
import { useNotificationSessionScope } from "@/entities/notification";
import { ApiError } from "@/shared/api";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { showAppToast } from "@/shared/ui/app-toast";
import { selectAnalysisBanner } from "@/widgets/route-header";

import {
  getAnalysisFailureMessage,
  toRecognitionResult,
} from "./receipt-recognition";
import { useReceiptResultStore } from "./use-receipt-result-store";

const SLOW_ANALYSIS_MS = 3000;
const DONE_STATUSES: readonly ImageAnalysisStatus[] = [
  "COMPLETED",
  "PARTIALLY_COMPLETED",
  "FAILED",
];

function getSubmitErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "IMAGE-429-001") {
      return "오늘 분석할 수 있는 사진 100장을 모두 사용했어요";
    }
    if (error.code === "IMAGE-503-001") {
      // shortcut: 접수 장애와 운영시간 제한이 같은 코드이므로, 백엔드가 사유 코드를 제공하면 시간 추정을 대체한다.
      const hour = Number(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Seoul",
          hour: "2-digit",
          hourCycle: "h23",
        }).format(new Date()),
      );
      return hour < 9 || hour >= 18
        ? "사진 인식 기능은 오전 9시부터 오후 6시까지만 사용할 수 있어요"
        : "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요";
    }
  }
  return "사진을 보내지 못했어요. 다시 시도해 주세요";
}

export type ReceiptAnalysisFailure = "FAILED" | null;

export function useReceiptAnalysis() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userScope = useNotificationSessionScope();
  const registeredIds = useRegisteredAnalyses((state) =>
    userScope ? state.idsBySession[userScope] : undefined,
  );
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [now] = useState(() => Date.now());
  const setResult = useReceiptResultStore((state) => state.setResult);
  const list = useQuery({
    ...imageAnalysisQueries.list(userScope ?? ""),
    enabled: Boolean(userScope),
  });
  const pending = selectAnalysisBanner(list.data?.analyses ?? [], now, [
    ...(registeredIds ?? []),
    ...dismissedIds,
  ]);
  const isPendingInProgress =
    pending?.status === "QUEUED" || pending?.status === "PROCESSING";
  const analysisId =
    submittedId ?? (isPendingInProgress ? pending.analysisId : null);
  const uncheckedResult =
    analysisId === null &&
    (pending?.status === "COMPLETED" ||
      pending?.status === "PARTIALLY_COMPLETED")
      ? pending
      : null;
  const removeAnalysis = useDeleteImageAnalysis();
  const submit = useMutation({
    meta: { monitoringOperation: "image.analysis.submit" },
    mutationFn: async (files: File[]) => {
      const objectKeys = await Promise.all(
        files.map((file) => uploadImage(file, "ANALYSIS")),
      );
      return requestImageAnalysis(objectKeys);
    },
    onSuccess: (submission) => {
      setSubmittedId(submission.analysisId);
      void queryClient.invalidateQueries({
        queryKey: imageAnalysisQueries.lists(),
      });
    },
    onError: (error) =>
      showAppToast({
        message: getSubmitErrorMessage(error),
        variant: "error",
      }),
  });
  const analysis = useQuery({
    ...imageAnalysisQueries.detail(analysisId ?? ""),
    enabled: analysisId !== null,
  });
  const doneAnalysis =
    analysis.data && DONE_STATUSES.includes(analysis.data.status)
      ? analysis.data
      : null;
  const result = useMemo(
    () => (doneAnalysis ? toRecognitionResult(doneAnalysis) : null),
    [doneAnalysis],
  );
  const failure: ReceiptAnalysisFailure =
    !doneAnalysis || !result
      ? null
      : doneAnalysis.status === "FAILED" || result.drafts.length === 0
        ? "FAILED"
        : null;
  const failureMessage = doneAnalysis
    ? getAnalysisFailureMessage(doneAnalysis)
    : undefined;
  const isAnalyzing =
    submit.isPending ||
    (analysisId !== null && !analysis.isError && failure === null);
  const analyzingImages = analysis.data?.results ?? [];
  const progress = {
    processed: analyzingImages.filter(
      (image) => image.status === "COMPLETED" || image.status === "FAILED",
    ).length,
    total: analyzingImages.length || submit.variables?.length || 0,
  };

  useEffect(() => {
    if (!isAnalyzing) return;

    const slowTimer = window.setTimeout(
      () =>
        showAppToast({ message: "조금만 기다려 주세요", variant: "success" }),
      SLOW_ANALYSIS_MS,
    );

    return () => window.clearTimeout(slowTimer);
  }, [isAnalyzing]);

  useEffect(() => {
    if (!analysis.isError) return;

    showAppToast({
      message: "인식 결과를 불러오지 못했어요. 다시 시도해 주세요",
      variant: "error",
    });
  }, [analysis.isError]);

  useEffect(() => {
    if (!result || failure === "FAILED") return;

    setResult(result);
    if (failure === null) {
      const href = routes.imageAnalysisResult(result.analysisId);
      markAppNavigationIntent("push", href);
      router.push(href);
    }
  }, [result, failure, router, setResult]);

  return {
    isAnalyzing,
    progress,
    analyze: (files: File[]) => submit.mutate(files),
    failure,
    failureMessage,
    dismissFailure: () => {
      if (analysisId) {
        setDismissedIds((ids) => [...ids, analysisId]);
        removeAnalysis.mutate(analysisId);
      }
      setSubmittedId(null);
    },
    uncheckedResult,
    isDiscarding: removeAnalysis.isPending,
    discardUncheckedResult: () => {
      if (!uncheckedResult) return;
      removeAnalysis.mutate(uncheckedResult.analysisId, {
        onError: () =>
          showAppToast({
            message: "이전 결과를 지우지 못했어요. 다시 시도해 주세요",
            variant: "error",
          }),
      });
    },
  };
}
