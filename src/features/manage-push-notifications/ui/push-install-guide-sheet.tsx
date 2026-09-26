"use client";

import { siteConfig } from "@/shared/config";
import {
  AppBottomSheet,
  AppBottomSheetDescription,
  AppBottomSheetTitle,
} from "@/shared/ui/app-bottom-sheet";
import { FooterButton } from "@/shared/ui/footer-button";

type PushInstallGuideSheetProps = {
  open: boolean;
  onDismiss: () => void;
};

const installSteps = [
  "Safari 하단의 공유 버튼을 눌러 주세요",
  "'홈 화면에 추가'를 선택해 주세요",
  `홈 화면에 생긴 ${siteConfig.name} 앱으로 다시 열어 주세요`,
];

export function PushInstallGuideSheet({
  open,
  onDismiss,
}: PushInstallGuideSheetProps) {
  return (
    <AppBottomSheet open={open} onDismiss={onDismiss}>
      <AppBottomSheetTitle className="m-0 font-app-heading text-[16px] font-black leading-[1.35] tracking-normal">
        홈 화면에 추가해 주세요
      </AppBottomSheetTitle>
      <AppBottomSheetDescription className="m-[4px_0_12px] font-app-body text-[12.5px] leading-[1.35] text-app-ink/50">
        아이폰에서는 홈 화면에 추가한 앱에서만 알림을 받을 수 있어요.
      </AppBottomSheetDescription>

      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {installSteps.map((step, index) => (
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
