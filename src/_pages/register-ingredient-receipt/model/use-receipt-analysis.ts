"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { routes } from "@/shared/routes";
import { showAppToast } from "@/shared/ui/app-toast";

const SLOW_ANALYSIS_MS = 3000;
// TODO: OCR API 연결 전이라 '조금만 기다려 주세요'까지 보이도록 고정 지연 후 목업 결과로 넘어간다. 연결 시 응답 시점으로 교체.
const MOCK_ANALYSIS_MS = 4000;

export function useReceiptAnalysis() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!isAnalyzing) return;

    const slowTimer = window.setTimeout(
      () =>
        showAppToast({ message: "조금만 기다려 주세요", variant: "success" }),
      SLOW_ANALYSIS_MS,
    );
    const doneTimer = window.setTimeout(() => {
      setIsAnalyzing(false);
      router.push(routes.registerIngredientReceiptResult);
    }, MOCK_ANALYSIS_MS);

    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(doneTimer);
    };
  }, [isAnalyzing, router]);

  function analyze() {
    // TODO: OCR API 연결 시 photos[].file을 전송하고 결과를 REG-003에 넘긴다.
    setIsAnalyzing(true);
  }

  return { isAnalyzing, analyze };
}
