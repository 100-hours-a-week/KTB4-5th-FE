import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";

import { bugReportRequestSchema } from "@/features/report-bug/index.server";
import type { ApiResponse } from "@/shared/api";

import { consumeBugReportQuota } from "./rate-limit";
import { readSessionUser } from "./read-session-user-id";
import { sendDiscordBugReport } from "./send-discord-bug-report";

function problem(status: number, code: string, title: string) {
  return Response.json(
    { type: "about:blank", title, status, code },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

export async function postBugReport(request: NextRequest): Promise<Response> {
  const webhookUrl = process.env.DISCORD_BUG_REPORT_WEBHOOK_URL;
  if (!webhookUrl) {
    return problem(503, "REPORT-503-001", "버그 리포트가 설정되지 않았습니다.");
  }

  let userId: string | null;
  try {
    userId = await readSessionUser(request);
  } catch (error) {
    Sentry.captureException(error);
    return problem(503, "REPORT-503-002", "로그인 상태를 확인하지 못했습니다.");
  }
  if (userId === null) {
    return problem(401, "REPORT-401-001", "로그인이 필요합니다.");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return problem(400, "REPORT-400-001", "요청 형식이 올바르지 않습니다.");
  }

  const fields = bugReportRequestSchema.safeParse(json);
  if (!fields.success) {
    return problem(400, "REPORT-400-002", "입력값이 올바르지 않습니다.");
  }

  if (!consumeBugReportQuota(userId)) {
    return problem(429, "REPORT-429-001", "잠시 후 다시 시도해 주세요.");
  }

  try {
    await sendDiscordBugReport(webhookUrl, { ...fields.data, userId });
  } catch (error) {
    Sentry.captureException(error);
    return problem(502, "REPORT-502-001", "버그 리포트를 전달하지 못했습니다.");
  }

  const body: ApiResponse<null> = {
    code: "REPORT-201-001",
    message: "버그 리포트를 전송했습니다.",
    data: null,
  };
  return Response.json(body, { status: 201 });
}
