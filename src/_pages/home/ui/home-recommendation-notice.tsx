"use client";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { useRecommendations } from "@/features/prepare-recommendations";
import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";

export function HomeRecommendationNotice() {
  const refrigeratorId = useCurrentRefrigeratorId();
  const { data, job } = useRecommendations(refrigeratorId);
  return (
    <section
      className="px-5 pt-6"
      aria-labelledby="home-recommendation-heading"
    >
      <AppLink
        href={routes.recommendations}
        className="block rounded-[4px] bg-white px-4 py-3 text-app-ink no-underline shadow-app-sm"
      >
        <h2
          id="home-recommendation-heading"
          className="m-0 font-app-heading text-[14px] font-black"
        >
          오늘의 추천 요리
        </h2>
        <p className="mb-0 mt-1 text-[12.5px] text-app-ink/60">
          {data?.recipes[0]?.name ??
            (job.isError
              ? "추천 요리 확인하기"
              : "보유 재료로 추천을 준비하고 있어요")}
        </p>
      </AppLink>
    </section>
  );
}
