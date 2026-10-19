"use client";

import { useMutation } from "@tanstack/react-query";

import { submitBugReport } from "../api/submit-bug-report";
import type { BugReportFormValues } from "./bug-report-form.schema";

export function useSubmitBugReport() {
  return useMutation({
    mutationFn: (input: BugReportFormValues) =>
      submitBugReport({
        ...input,
        pageUrl: `${window.location.pathname}${window.location.search}`,
      }),
  });
}
