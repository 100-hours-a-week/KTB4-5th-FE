import Image from "next/image";

import { Chip } from "@/shared/ui/chip";

export function HomeRecommendationNotice() {
  return (
    <section
      className="px-5 pt-6"
      aria-labelledby="home-recommendation-heading"
    >
      <div className="flex items-center gap-3.5 rounded-[4px] border border-dashed border-app-neutral-300 bg-white/70 px-4 py-3.5">
        <span className="grid size-[62px] flex-none place-items-center rounded-full bg-app-warning/15">
          <Image
            src="/icons/loading_logo.png"
            alt=""
            width={56}
            height={56}
            className="size-[56px] object-contain opacity-90"
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="home-recommendation-heading"
              className="mb-0 font-app-heading text-[15px] font-black leading-tight text-app-ink/70"
            >
              오늘의 추천 요리
            </h2>
            <Chip tone="neutral">다음 버전</Chip>
          </div>
          <p className="mb-0 mt-1.5 break-keep text-[13px] leading-5 text-app-ink/60">
            보유 재료로 만들 수 있는 요리 추천은 다음 버전에서 제공해요
          </p>
        </div>
      </div>
    </section>
  );
}
