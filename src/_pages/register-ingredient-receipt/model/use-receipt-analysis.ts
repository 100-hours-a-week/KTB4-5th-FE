"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { routes } from "@/shared/routes";
import { showAppToast } from "@/shared/ui/app-toast";

import {
  createMockRecognitionResult,
  type MockRecognitionScenario,
} from "./receipt-recognition";
import { useReceiptResultStore } from "./use-receipt-result-store";

const SLOW_ANALYSIS_MS = 3000;
// TODO: OCR API 연결 전이라 '조금만 기다려 주세요'까지 보이도록 고정 지연 후 목업 결과로 넘어간다. 연결 시 응답 시점으로 교체.
const MOCK_ANALYSIS_MS = 4000;
const MOCK_SCENARIOS: readonly MockRecognitionScenario[] = [
  "fail",
  "partial",
  "over",
];

function readMockScenario(): MockRecognitionScenario {
  const value = new URLSearchParams(window.location.search).get("ocr");
  return MOCK_SCENARIOS.find((scenario) => scenario === value) ?? "default";
}

export type ReceiptAnalysisFailure = "FAILED" | "PARTIAL" | null;

export function useReceiptAnalysis() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [failure, setFailure] = useState<ReceiptAnalysisFailure>(null);
  const setResult = useReceiptResultStore((state) => state.setResult);

  useEffect(() => {
    if (!isAnalyzing) return;

    const slowTimer = window.setTimeout(
      () =>
        showAppToast({ message: "조금만 기다려 주세요", variant: "success" }),
      SLOW_ANALYSIS_MS,
    );
    const doneTimer = window.setTimeout(() => {
      const result = createMockRecognitionResult(readMockScenario());
      setIsAnalyzing(false);

      if (result.drafts.length === 0) {
        setFailure("FAILED");
        return;
      }

      setResult(result);

      if (result.unreadCount > 0) {
        setFailure("PARTIAL");
        return;
      }

      router.push(routes.registerIngredientReceiptResult);
    }, MOCK_ANALYSIS_MS);

    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(doneTimer);
    };
  }, [isAnalyzing, router, setResult]);

  function analyze() {
    // TODO: OCR API 연결 시 photos[].file을 전송하고 결과를 REG-003에 넘긴다.
    setIsAnalyzing(true);
  }

  function continueWithPartial() {
    setFailure(null);
    router.push(routes.registerIngredientReceiptResult);
  }

  return {
    isAnalyzing,
    analyze,
    failure,
    dismissFailure: () => setFailure(null),
    continueWithPartial,
  };
}
