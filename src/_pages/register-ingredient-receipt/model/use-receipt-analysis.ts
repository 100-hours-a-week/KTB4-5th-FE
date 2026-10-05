"use client";

import { useEffect, useState } from "react";

const SLOW_ANALYSIS_MS = 3000;

/** OCR 분석 중 상태. 3초가 넘으면 isSlow로 보조 문구를 띄운다. */
export function useReceiptAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isAnalyzing) return;

    const timer = window.setTimeout(() => setIsSlow(true), SLOW_ANALYSIS_MS);

    return () => {
      window.clearTimeout(timer);
      setIsSlow(false);
    };
  }, [isAnalyzing]);

  function analyze() {
    // TODO: OCR API 연결 전이라 분석 중 상태만 띄운다. 연결 시 photos[].file을 전송하고 결과로 REG-003 이동.
    setIsAnalyzing(true);
  }

  return { isAnalyzing, isSlow, analyze };
}
