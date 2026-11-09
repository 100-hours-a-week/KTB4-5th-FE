"use client";

import { useEffect } from "react";

import { ensureCsrfToken } from "@/shared/api";

export function CsrfBootstrapProvider() {
  useEffect(() => {
    void ensureCsrfToken().catch(() => {
      // 다음 변경 요청에서 CSRF 발급을 다시 시도한다.
    });
  }, []);

  return null;
}
