import { z } from "zod";

export const BUG_REPORT_CATEGORIES = ["BUG", "IMPROVEMENT", "ETC"] as const;

export type BugReportCategory = (typeof BUG_REPORT_CATEGORIES)[number];

export const bugReportCategoryLabels = {
  BUG: "버그",
  IMPROVEMENT: "개선 제안",
  ETC: "기타",
} satisfies Record<BugReportCategory, string>;

export const BUG_REPORT_REPORTER_NAME_MAX_LENGTH = 50;

export const BUG_REPORT_REPORTER_NAME_EXAMPLE = "ojosama.five(오조사마)";

export const BUG_REPORT_DESCRIPTION_MAX_LENGTH = 1000;

export const BUG_REPORT_DESCRIPTION_HINT = `${BUG_REPORT_DESCRIPTION_MAX_LENGTH.toLocaleString("ko-KR")}자까지 입력할 수 있어요`;

export const bugReportFormSchema = z.object({
  reporterName: z
    .string()
    .trim()
    .min(1, "이름을 입력해주세요")
    .max(
      BUG_REPORT_REPORTER_NAME_MAX_LENGTH,
      `${BUG_REPORT_REPORTER_NAME_MAX_LENGTH}자까지 입력할 수 있어요`,
    ),
  category: z.enum(BUG_REPORT_CATEGORIES, { error: "유형을 선택해주세요" }),
  description: z
    .string()
    .trim()
    .min(1, "내용을 입력해주세요")
    .max(BUG_REPORT_DESCRIPTION_MAX_LENGTH, BUG_REPORT_DESCRIPTION_HINT),
});

export type BugReportFormValues = z.infer<typeof bugReportFormSchema>;

export const bugReportRequestSchema = bugReportFormSchema.extend({
  pageUrl: z.string().max(2048).optional(),
});

export type BugReportRequest = z.infer<typeof bugReportRequestSchema>;
