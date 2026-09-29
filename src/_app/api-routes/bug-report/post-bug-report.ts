import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  bugReportFormSchema,
  getScreenshotError,
} from "@/features/report-bug/index.server";
import type { ApiResponse } from "@/shared/api";

import { consumeBugReportQuota } from "./rate-limit";
import { readSessionUser } from "./read-session-user-id";
import { sendDiscordBugReport } from "./send-discord-bug-report";

const clientContextSchema = z
  .object({
    pageUrl: z.string().max(2048),
    userAgent: z.string().max(1024),
    viewport: z.string().max(64),
    reportedAt: z.string().max(64),
  })
  .partial();

function problem(status: number, code: string, title: string) {
  return Response.json(
    { type: "about:blank", title, status, code },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

function parseClientContext(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return {};
  }

  try {
    return clientContextSchema.safeParse(JSON.parse(value)).data ?? {};
  } catch {
    return {};
  }
}

export async function postBugReport(request: NextRequest): Promise<Response> {
  const webhookUrl = process.env.DISCORD_BUG_REPORT_WEBHOOK_URL;
  if (!webhookUrl) {
    return problem(503, "REPORT-503-001", "버그 리포트가 설정되지 않았습니다.");
  }

  const { hasSession, userId } = readSessionUser(request);
  if (!hasSession) {
    return problem(401, "REPORT-401-001", "로그인이 필요합니다.");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return problem(400, "REPORT-400-001", "요청 형식이 올바르지 않습니다.");
  }

  const fields = bugReportFormSchema.safeParse({
    reporterName: formData.get("reporterName"),
    category: formData.get("category"),
    description: formData.get("description"),
  });
  if (!fields.success) {
    return problem(400, "REPORT-400-002", "입력값이 올바르지 않습니다.");
  }

  const screenshotEntry = formData.get("screenshot");
  const screenshot =
    screenshotEntry instanceof File && screenshotEntry.size > 0
      ? screenshotEntry
      : null;
  if (screenshot && getScreenshotError(screenshot)) {
    return problem(400, "REPORT-400-003", "첨부 이미지가 올바르지 않습니다.");
  }

  const quotaKey =
    userId ?? request.headers.get("x-forwarded-for") ?? "anonymous";
  if (!consumeBugReportQuota(quotaKey)) {
    return problem(429, "REPORT-429-001", "잠시 후 다시 시도해 주세요.");
  }

  try {
    await sendDiscordBugReport(webhookUrl, {
      ...fields.data,
      userId,
      context: parseClientContext(formData.get("context")),
      screenshot,
    });
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
