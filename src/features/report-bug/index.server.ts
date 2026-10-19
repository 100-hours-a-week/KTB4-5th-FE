// Route Handler가 클라이언트 UI 없이 같은 입력 규칙을 쓰도록 스키마만 공개한다.
export {
  bugReportCategoryLabels,
  bugReportRequestSchema,
} from "./model/bug-report-form.schema";
export type {
  BugReportCategory,
  BugReportRequest,
} from "./model/bug-report-form.schema";
