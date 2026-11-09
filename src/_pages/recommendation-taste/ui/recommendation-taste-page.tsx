"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { IngredientRefrigeratorRequiredState } from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import {
  MAX_TASTE_TAGS,
  setTodayTaste,
  TasteOptionGroups,
  toRecommendationJobRequest,
  useTodayTaste,
} from "@/features/answer-taste-survey";
import {
  useInventoryEmpty,
  useRecommendations,
} from "@/features/prepare-recommendations";
import { ApiError } from "@/shared/api";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { isWithinAiServiceHours } from "@/shared/lib/seoul-date";
import { AppLink } from "@/shared/ui/app-link";
import { routes } from "@/shared/routes";
import { FooterButton } from "@/shared/ui/footer-button";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

export function RecommendationTastePage() {
  const router = useRouter();
  const refrigeratorId = useCurrentRefrigeratorId();
  const { data, job, regenerate } = useRecommendations(refrigeratorId);
  const savedIds = useTodayTaste(refrigeratorId);
  const inventoryEmpty = useInventoryEmpty(refrigeratorId);
  const [selected, setSelected] = useState<string[] | null>(null);
  const value = selected ?? savedIds ?? [];
  const limitReached =
    data?.dailyGeneration.remaining === 0 ||
    (job.error instanceof ApiError && job.error.status === 429);
  const disabled =
    !refrigeratorId ||
    job.isPending ||
    data?.status === "GENERATING" ||
    limitReached ||
    inventoryEmpty ||
    Boolean(data?.hasNewRecommendation);

  if (refrigeratorId === null) return <IngredientRefrigeratorRequiredState />;

  function request(optionIds: string[]) {
    if (!refrigeratorId) return;
    regenerate(toRecommendationJobRequest(optionIds), {
      onSuccess: () => {
        setTodayTaste(refrigeratorId, optionIds);
        markAppNavigationIntent("replace", routes.recommendations);
        router.replace(routes.recommendations);
      },
    });
  }

  return (
    <PageActionLayout
      action={
        <div className="flex gap-[10px]">
          <FooterButton
            variant="secondary"
            disabled={disabled}
            onClick={() => request([])}
          >
            상관없어요
          </FooterButton>
          <FooterButton
            disabled={disabled || value.length === 0}
            onClick={() => request(value)}
          >
            이 취향으로 추천
          </FooterButton>
        </div>
      }
    >
      <div className="flex flex-col gap-5 px-5 pt-4 pb-6">
        <section>
          <h2 className="m-0 font-app-heading text-[19px] font-black leading-[1.35]">
            오늘은 어떤 요리가 끌리세요?
          </h2>
          <p className="mb-0 mt-1.5 break-keep text-[13px] leading-[1.5] text-app-ink/60">
            고른 취향과 지금 재고로 새 추천을 만들어요. 취향은 내일 오전 7시까지
            유지돼요. 취향은 인분 수를 제외하고 최대 {MAX_TASTE_TAGS}개까지
            선택할 수 있어요.
            {data && !limitReached
              ? ` 오늘 ${data.dailyGeneration.remaining}번 더 받을 수 있어요.`
              : null}
          </p>
        </section>
        {data?.hasNewRecommendation ? (
          <AppLink href={routes.recommendations}>
            새 추천이 준비됐어요. 추천 목록에서 먼저 확인해 주세요.
          </AppLink>
        ) : null}
        {limitReached ? (
          <p
            role="status"
            className="m-0 rounded-[4px] bg-app-warning/15 px-4 py-2.5 text-[12.5px] font-bold"
          >
            오늘의 추천 생성을 모두 사용했어요. 내일 새로 받을 수 있어요.
          </p>
        ) : inventoryEmpty ? (
          <AppLink
            href={routes.registerIngredient}
            className="m-0 rounded-[4px] bg-app-warning/15 px-4 py-2.5 text-[12.5px] font-bold text-app-ink"
          >
            재료를 먼저 등록해주세요
          </AppLink>
        ) : job.isError ? (
          <p role="alert" className="m-0 text-[13px] text-app-primary">
            {job.error instanceof ApiError &&
            job.error.code === "RECOMMEND-409-003"
              ? "이미 추천을 만들고 있어요. 완료되면 다시 시도해 주세요."
              : job.error instanceof ApiError &&
                  job.error.code === "RECOMMEND-409-004"
                ? "새 추천이 준비됐어요. 추천 목록에서 먼저 확인해 주세요."
                : job.error instanceof ApiError &&
                    job.error.status === 503 &&
                    !isWithinAiServiceHours()
                  ? "추천 생성은 오전 9시부터 오후 6시까지만 할 수 있어요."
                  : "새 추천을 만들지 못했어요. 잠시 후 다시 시도해 주세요."}
          </p>
        ) : null}
        <TasteOptionGroups value={value} onChange={setSelected} />
      </div>
    </PageActionLayout>
  );
}
