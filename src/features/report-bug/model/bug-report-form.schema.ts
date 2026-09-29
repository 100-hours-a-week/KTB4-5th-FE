import { z } from "zod";

export const BUG_REPORT_CATEGORIES = ["BUG", "IMPROVEMENT", "ETC"] as const;

export type BugReportCategory = (typeof BUG_REPORT_CATEGORIES)[number];

export const bugReportCategoryLabels = {
  BUG: "버그",
  IMPROVEMENT: "개선 제안",
  ETC: "기타",
} satisfies Record<BugReportCategory, string>;

export const BUG_REPORT_DESCRIPTION_MAX_LENGTH = 1000;

// 디스코드 Webhook 첨부 한도(10MB) 안에서 요청 여유를 둔다.
export const BUG_REPORT_SCREENSHOT_MAX_BYTES = 8 * 1024 * 1024;

export const BUG_REPORT_SCREENSHOT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const BUG_REPORT_DESCRIPTION_HINT = `${BUG_REPORT_DESCRIPTION_MAX_LENGTH.toLocaleString("ko-KR")}자까지 입력할 수 있어요`;

export const bugReportFormSchema = z.object({
  category: z.enum(BUG_REPORT_CATEGORIES, { error: "유형을 선택해주세요" }),
  description: z
    .string()
    .trim()
    .min(1, "내용을 입력해주세요")
    .max(BUG_REPORT_DESCRIPTION_MAX_LENGTH, BUG_REPORT_DESCRIPTION_HINT),
});

export type BugReportFormValues = z.infer<typeof bugReportFormSchema>;

export function getScreenshotError(file: File): string | null {
  if (!(BUG_REPORT_SCREENSHOT_TYPES as readonly string[]).includes(file.type)) {
    return "PNG·JPG·WEBP·GIF 이미지만 첨부할 수 있어요";
  }

  if (file.size > BUG_REPORT_SCREENSHOT_MAX_BYTES) {
    return "8MB 이하 이미지만 첨부할 수 있어요";
  }

  return null;
}
