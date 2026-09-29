import { bugReportCategoryLabels } from "@/features/report-bug/index.server";
import type {
  BugReportCategory,
  BugReportClientContext,
} from "@/features/report-bug/index.server";

const categoryColors = {
  BUG: 0xe03a2b,
  IMPROVEMENT: 0xe8a33d,
  ETC: 0x7d7979,
} satisfies Record<BugReportCategory, number>;

const screenshotExtensions: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const WEBHOOK_TIMEOUT_MS = 10_000;

export type DiscordBugReport = {
  category: BugReportCategory;
  description: string;
  userId: string | null;
  context: Partial<BugReportClientContext>;
  screenshot: File | null;
};

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function field(name: string, value: string | undefined, inline = false) {
  return {
    name,
    value: truncate(value?.trim() || "-", 1024),
    inline,
  };
}

function buildTitle(category: BugReportCategory, description: string) {
  const firstLine = description.split("\n")[0] ?? "";
  return truncate(`[${bugReportCategoryLabels[category]}] ${firstLine}`, 256);
}

export async function sendDiscordBugReport(
  webhookUrl: string,
  report: DiscordBugReport,
): Promise<void> {
  const { category, description, userId, context, screenshot } = report;
  const screenshotName = screenshot
    ? `screenshot.${screenshotExtensions[screenshot.type] ?? "png"}`
    : null;

  const payload = {
    username: "다먹자 버그 리포트",
    // 사용자가 입력한 @everyone·역할 멘션이 알림을 보내지 않게 막는다.
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: buildTitle(category, description),
        description: truncate(description, 4096),
        color: categoryColors[category],
        timestamp: new Date().toISOString(),
        fields: [
          field("사용자 ID", userId ?? "확인 불가", true),
          field(
            "환경",
            process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
            true,
          ),
          field("앱 버전", process.env.NEXT_PUBLIC_SENTRY_RELEASE, true),
          field("화면", context.pageUrl && `\`${context.pageUrl}\``),
          field("뷰포트", context.viewport, true),
          field("신고 시각(기기)", context.reportedAt, true),
          field("User-Agent", context.userAgent),
        ],
        ...(screenshotName
          ? { image: { url: `attachment://${screenshotName}` } }
          : {}),
      },
    ],
  };

  const body = new FormData();
  body.set("payload_json", JSON.stringify(payload));
  if (screenshot && screenshotName) {
    body.set("files[0]", screenshot, screenshotName);
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Discord Webhook 전송 실패: ${response.status} ${await response.text().catch(() => "")}`,
    );
  }
}
