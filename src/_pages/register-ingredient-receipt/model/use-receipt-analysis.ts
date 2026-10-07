"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  imageAnalysisQueries,
  type ImageAnalysisStatus,
  requestImageAnalysis,
  uploadImage,
} from "@/entities/image";
import { routes } from "@/shared/routes";
import { showAppToast } from "@/shared/ui/app-toast";

import { toRecognitionResult } from "./receipt-recognition";
import { useReceiptResultStore } from "./use-receipt-result-store";

const SLOW_ANALYSIS_MS = 3000;
const DONE_STATUSES: readonly ImageAnalysisStatus[] = [
  "COMPLETED",
  "PARTIALLY_COMPLETED",
  "FAILED",
];

export type ReceiptAnalysisFailure = "FAILED" | "PARTIAL" | null;

export function useReceiptAnalysis() {
  const router = useRouter();
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const setResult = useReceiptResultStore((state) => state.setResult);
  const submit = useMutation({
    meta: { monitoringOperation: "image.analysis.submit" },
    mutationFn: async (files: File[]) => {
      const objectKeys = await Promise.all(
        files.map((file) => uploadImage(file, "ANALYSIS")),
      );
      return requestImageAnalysis(objectKeys);
    },
    onSuccess: (submission) => setAnalysisId(submission.analysisId),
    onError: () =>
      showAppToast({
        message: "영수증을 보내지 못했어요. 다시 시도해 주세요",
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
        : result.unreadCount > 0
          ? "PARTIAL"
          : null;
  const isAnalyzing =
    submit.isPending ||
    (analysisId !== null && !analysis.isError && failure === null);

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
    if (failure === null) router.push(routes.registerIngredientReceiptResult);
  }, [result, failure, router, setResult]);

  function continueWithPartial() {
    router.push(routes.registerIngredientReceiptResult);
  }

  return {
    isAnalyzing,
    analyze: (files: File[]) => submit.mutate(files),
    failure,
    dismissFailure: () => setAnalysisId(null),
    continueWithPartial,
  };
}
