"use client";

import { useEffect } from "react";

import { ensureCsrfToken } from "@/shared/api";

export function CsrfBootstrapProvider() {
  useEffect(() => {
    void ensureCsrfToken();
  }, []);

  return null;
}
