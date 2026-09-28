import {
  PUSH_INSTALL_GUIDE_DESCRIPTION,
  PUSH_INSTALL_GUIDE_STEPS,
  PUSH_INSTALL_GUIDE_TITLE,
  PUSH_PERMISSION_SETTINGS_PATH,
} from "@/features/manage-push-notifications/index.server";
import { Badge } from "@/shared/ui/badge";

import { LoginBackButton } from "./login-back-button";

export function LoginNotiOnboarding() {
  return (
    <div className="px-5 pt-[calc(12px+var(--safe-top))]">
      <LoginBackButton />

      <div className="px-1 pt-7">
        <p className="mb-2 text-[13px] font-bold text-app-primary">알림 안내</p>
        <h1 className="m-0 text-left text-[24px] leading-[1.35] text-app-ink">
          매일 아침,
          <br />
          오늘 챙길 재료를
          <br />
          알려드릴게요
        </h1>
      </div>

      <div className="mt-7 flex flex-col gap-3 pb-5">
        <div className="relative pt-[11px]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 z-[1] h-5 w-[58px] -translate-x-1/2 -rotate-3 bg-[color-mix(in_srgb,var(--color-highlight)_80%,transparent)]"
          />
          <div className="rounded-[4px] bg-white px-[18px] py-4 text-app-ink shadow-app-md">
            <div className="flex items-center justify-between gap-2">
              <strong className="text-[15px] font-black">
                매일 오전 8시 알림
              </strong>
              <Badge tone="primary" className="shrink-0">
                하루 1회
              </Badge>
            </div>
            <p className="mb-0 mt-1 text-sm text-app-neutral-700">
              유통기한이 3일 남은 재료부터 알려드려요
            </p>
            <p className="mb-0 mt-1 text-sm text-app-neutral-700">
              마이페이지에서 푸시 알림을 언제든 켜고 끌 수 있어요
            </p>
          </div>
        </div>

        <div className="rounded-[4px] border border-dashed border-app-ink/20 px-4 py-3">
          <strong className="text-[14px] font-bold">iOS 설정 안내:</strong>
          <p className="mb-0 mt-1 text-[13px] leading-5 text-app-ink/55">
            {PUSH_INSTALL_GUIDE_DESCRIPTION}
          </p>
          <ol className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {PUSH_INSTALL_GUIDE_STEPS.map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-2.5 text-[13px] leading-[1.4] text-app-ink"
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
          <p className="mb-0 mt-3 text-[12.5px] leading-5 text-app-ink/55">
            아이폰 설정에서 차단했다면 설정에서 다시 허용해주세요
          </p>
        </div>
      </div>
    </div>
  );
}
