import { ApiError } from "@/shared/api";
import type { ApiProblem } from "@/shared/api";

import type { BugReportFormValues } from "../model/bug-report-form.schema";

// 디스코드 Webhook URL을 숨기기 위해 백엔드가 아닌 Next.js Route Handler로 보낸다.
// 운영 nginx가 /api/* 전체를 백엔드로 넘기므로 /api 밖의 경로를 쓴다.
const BUG_REPORT_ENDPOINT = "/bug-reports";

export type BugReportClientContext = {
  pageUrl: string;
  userAgent: string;
  viewport: string;
  reportedAt: string;
};

export type SubmitBugReportRequest = BugReportFormValues & {
  screenshot: File | null;
  context: BugReportClientContext;
};

export async function submitBugReport({
  reporterName,
  category,
  description,
  screenshot,
  context,
}: SubmitBugReportRequest): Promise<void> {
  const body = new FormData();
  body.set("reporterName", reporterName);
  body.set("category", category);
  body.set("description", description);
  body.set("context", JSON.stringify(context));
  if (screenshot) {
    body.set("screenshot", screenshot);
  }

  const response = await fetch(BUG_REPORT_ENDPOINT, {
    method: "POST",
    body,
    credentials: "same-origin",
  });

  if (response.ok) {
    return;
  }

  const problem = (await response
    .json()
    .catch(() => null)) as Partial<ApiProblem> | null;

  throw new ApiError(response.status, {
    code: problem?.code ?? `UNKNOWN-${response.status}-000`,
    title: problem?.title ?? `HTTP ${response.status} 오류`,
    detail: problem?.detail,
    status: response.status,
  });
}
