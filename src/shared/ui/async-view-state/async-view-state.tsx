import type { ReactNode } from "react";

import { AsyncViewIllustration } from "./async-view-illustration";
import {
  type AsyncViewStatus,
  asyncViewIllustrations,
} from "./async-view-illustrations";

type AsyncViewStateProps = {
  status: AsyncViewStatus;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export const asyncViewActionClassName =
  "rounded-full bg-app-ink px-6 py-3 text-sm font-bold text-app-canvas";

const loadingDotDelays = ["0ms", "160ms", "320ms"];

function LoadingDots() {
  return (
    <span aria-hidden="true" className="mt-2 flex h-3 items-end gap-1.5">
      {loadingDotDelays.map((delay) => (
        <span
          key={delay}
          style={{ animationDelay: delay }}
          className="size-1.5 animate-app-loading-dot rounded-full bg-app-ink/60"
        />
      ))}
    </span>
  );
}

/**
 * SERVICE_COMMON_RULES 4 공용 상태 UI.
 * 골격은 `상태 일러스트 → 제목 → 보조 문구 → 액션 슬롯`으로 고정하고,
 * 액션이 없어도 슬롯 높이를 유지해 상태가 바뀔 때 레이아웃이 움직이지 않게 한다.
 * 일러스트는 상태로 정해지고 로딩은 그 아래에 움직이는 점을 더한다.
 * 어떤 상태를 보여줄지와 문구·액션은 사용처가 결정한다.
 */
export function AsyncViewState({
  action,
  className = "",
  description,
  status,
  title,
}: AsyncViewStateProps) {
  return (
    <div
      role={status === "error" ? "alert" : undefined}
      aria-busy={status === "loading" || undefined}
      className={`flex flex-col items-center px-5 py-10 text-center ${className}`}
    >
      {/* 상태가 바뀌면 이미지가 달라지므로 key로 스켈레톤 상태를 초기화한다. */}
      <AsyncViewIllustration
        key={status}
        src={asyncViewIllustrations[status]}
      />

      {status === "loading" ? <LoadingDots /> : null}

      <p className="mb-0 mt-3 font-app-heading text-[15px] font-black leading-tight text-app-ink">
        {title}
      </p>

      {description ? (
        <p className="mb-0 mt-1.5 max-w-[280px] break-keep text-[13px] leading-5 text-app-ink/55">
          {description}
        </p>
      ) : null}

      <div className="mt-4 flex min-h-12 items-center justify-center">
        {action}
      </div>
    </div>
  );
}
