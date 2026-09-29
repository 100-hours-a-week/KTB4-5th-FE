"use client";

import { useMutation } from "@tanstack/react-query";

import { submitBugReport } from "../api/submit-bug-report";
import type { BugReportClientContext } from "../api/submit-bug-report";
import type { BugReportFormValues } from "./bug-report-form.schema";

type SubmitBugReportInput = BugReportFormValues & {
  screenshot: File | null;
};

function collectClientContext(): BugReportClientContext {
  return {
    pageUrl: `${window.location.pathname}${window.location.search}`,
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`,
    reportedAt: new Date().toISOString(),
  };
}

export function useSubmitBugReport() {
  return useMutation({
    mutationFn: (input: SubmitBugReportInput) =>
      submitBugReport({ ...input, context: collectClientContext() }),
  });
}
