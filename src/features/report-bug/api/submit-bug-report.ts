import { requestJson } from "@/shared/api";

import type { BugReportRequest } from "../model/bug-report-form.schema";

// 운영 nginx가 /api/* 전체를 백엔드로 넘기므로 /api 밖의 경로를 쓴다.
const BUG_REPORT_ENDPOINT = "/bug-reports";

export async function submitBugReport(
  request: BugReportRequest,
): Promise<void> {
  await requestJson<null>(BUG_REPORT_ENDPOINT, {
    basePath: "",
    method: "POST",
    json: request,
  });
}
