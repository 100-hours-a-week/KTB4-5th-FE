"use client";

import {
  AppBottomSheet,
  AppBottomSheetDescription,
  AppBottomSheetTitle,
} from "@/shared/ui/app-bottom-sheet";
import { FooterButton } from "@/shared/ui/footer-button";

import {
  PUSH_PERMISSION_GUIDE_DESCRIPTION,
  PUSH_PERMISSION_GUIDE_STEPS,
  PUSH_PERMISSION_GUIDE_TITLE,
} from "../model/push-permission-guide";

type PushPermissionGuideSheetProps = {
  open: boolean;
  onDismiss: () => void;
};

export function PushPermissionGuideSheet({
  open,
  onDismiss,
}: PushPermissionGuideSheetProps) {
  return (
    <AppBottomSheet open={open} onDismiss={onDismiss}>
      <AppBottomSheetTitle className="m-0 font-app-heading text-[16px] font-black leading-[1.35] tracking-normal">
        {PUSH_PERMISSION_GUIDE_TITLE}
      </AppBottomSheetTitle>
      <AppBottomSheetDescription className="m-[4px_0_12px] font-app-body text-[12.5px] leading-[1.35] text-app-ink/50">
        {PUSH_PERMISSION_GUIDE_DESCRIPTION}
      </AppBottomSheetDescription>

      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {PUSH_PERMISSION_GUIDE_STEPS.map((step, index) => (
          <li
            key={step}
            className="flex items-center gap-2.5 font-app-body text-[13px] leading-[1.4] text-app-ink"
          >
            <span
              aria-hidden="true"
              className="grid size-5 shrink-0 place-items-center rounded-full bg-app-ink font-app-mono text-[11px] font-bold text-white"
            >
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <div className="mt-4 flex gap-2">
        <FooterButton size="sm" onClick={onDismiss}>
          확인
        </FooterButton>
      </div>
    </AppBottomSheet>
  );
}
