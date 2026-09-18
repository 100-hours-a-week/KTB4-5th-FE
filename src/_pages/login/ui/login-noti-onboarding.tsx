import { LoginBackButton } from "./login-back-button";

export function LoginNotiOnboarding() {
  return (
    <div className="px-5 pt-[calc(12px+var(--safe-top))]">
      <LoginBackButton />

      <div className="px-1 pt-7">
        <p className="mb-2 text-[13px] font-bold text-app-warning">알림 안내</p>
        <h1 className="m-0 text-left text-[29px] leading-[1.35] text-app-canvas">
          매일 아침,
          <br />
          오늘 챙길 재료를
          <br />
          알려드릴게요
        </h1>
      </div>

      <div className="mt-7 flex flex-col gap-3 pb-5">
        <div className="rounded-[4px] bg-app-canvas px-[18px] py-4 text-app-ink shadow-app-md">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-[17px] font-black">
              매일 오전 8시 알림
            </strong>
            <span className="shrink-0 bg-app-primary px-[9px] py-[3px] text-[11px] font-bold text-white">
              하루 1회
            </span>
          </div>
          <p className="mb-0 mt-1 text-sm text-app-neutral-700">
            가입하면 자동으로 켜져요
          </p>
        </div>

        <div className="rounded-[4px] bg-white/10 px-[18px] py-[15px]">
          <strong className="text-[15px] font-bold">
            유통기한이 3일 남은 재료부터 알려드려요
          </strong>
          <p className="mb-0 mt-1 text-[13px] leading-5 text-app-canvas/65">
            알림 끄기와 시간 변경은 다음 버전에서 제공돼요
          </p>
        </div>
      </div>
    </div>
  );
}
