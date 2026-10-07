import {
  RECOGNITION_STATUS_LABELS,
  type RecognitionStatus,
} from "../model/receipt-recognition";

const STATUS_CHIP_CLASS_NAMES = {
  RECOGNIZED: "bg-[#d9f5e1] text-[#15803d]",
  AI_ESTIMATED: "border-[1.5px] border-app-neutral-400 bg-white text-app-ink",
  NEEDS_CHECK: "bg-app-ink text-white",
  UNRECOGNIZED: "border-2 border-app-primary bg-white text-app-primary",
} satisfies Record<RecognitionStatus, string>;

export function RecognitionStatusChip({
  status,
}: {
  status: RecognitionStatus;
}) {
  return (
    <span
      className={`flex-none whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11px] font-bold leading-[1.45] ${STATUS_CHIP_CLASS_NAMES[status]}`}
    >
      {RECOGNITION_STATUS_LABELS[status]}
    </span>
  );
}
