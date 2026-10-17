import {
  ArrowRightOutlined,
  HourglassOutlined,
  CheckCircle1Outlined,
  XmarkCircleOutlined,
} from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";

export type AnalysisBannerProps =
  | { status: "processing"; processedCount: number; totalCount: number }
  | { status: "expiring"; minutesLeft: number }
  | { status: "completed" | "partial" | "failed" };

export function AnalysisBanner({
  closable = false,
  ...props
}: AnalysisBannerProps & { closable?: boolean }) {
  const isProcessing =
    props.status === "processing" || props.status === "expiring";

  return (
    <aside
      aria-label="사진 인식 안내"
      role="status"
      className="mx-[calc(var(--space-4)+var(--safe-right))] mb-app-3 ml-[calc(var(--space-4)+var(--safe-left))] flex min-h-12 flex-none items-center gap-app-3 rounded-app-sm border border-app-ink/20 bg-app-surface px-app-4 py-app-3 text-app-text"
    >
      <Lineicons
        icon={
          isProcessing
            ? HourglassOutlined
            : props.status === "failed"
              ? XmarkCircleOutlined
              : CheckCircle1Outlined
        }
        size={20}
        aria-hidden="true"
        focusable="false"
        className="shrink-0"
      />
      <p className="m-0 min-w-0 flex-1 text-[13px] font-bold leading-normal">
        {props.status === "processing"
          ? `영수증 인식 중 · ${props.processedCount}/${props.totalCount}장`
          : props.status === "expiring"
            ? `${props.minutesLeft}분 뒤에 인식 결과가 사라져요`
            : props.status === "failed"
              ? "인식 실패 · 결과 확인"
              : props.status === "partial"
                ? "일부 인식 완료 · 결과 확인"
                : "인식 완료 · 결과 확인"}
      </p>
      {closable ? (
        <span className="size-5 shrink-0" aria-hidden="true" />
      ) : null}
      <Lineicons
        icon={ArrowRightOutlined}
        size={20}
        aria-hidden="true"
        focusable="false"
        className="shrink-0"
      />
    </aside>
  );
}
