"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { IngredientRefrigeratorRequiredState } from "@/entities/ingredient";
import { useRecommendations } from "@/features/prepare-recommendations";
import { ApiError } from "@/shared/api";
import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";
import { RecommendedRecipeCard } from "./recommended-recipe-card";

const PREPARING_HINT_DELAY_MS = 3_000;

function PageLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-y-auto">
      {children}
    </main>
  );
}

function PreparingState() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setShowHint(true),
      PREPARING_HINT_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <AsyncViewState
        status="loading"
        title="보유 재료로 요리를 찾고 있어요"
        description={showHint ? "재료가 많으면 조금 더 걸려요" : undefined}
        className="px-0! py-4!"
      />
      <ul aria-hidden="true" className="flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <li
            key={index}
            className="flex items-center gap-3 rounded-[4px] bg-white px-4 py-3 shadow-app-sm"
          >
            <span className="size-15 flex-none animate-pulse rounded-[4px] bg-app-ink/[0.06]" />
            <span className="min-w-0 flex-1">
              <span className="block h-4 w-24 animate-pulse rounded-[4px] bg-app-ink/[0.06]" />
              <span className="mt-1.5 block h-3 w-40 animate-pulse rounded-[4px] bg-app-ink/[0.06]" />
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function RecommendationsPage() {
  const refrigeratorId = useCurrentRefrigeratorId();
  const { data, error, isFetching, refetch, job } =
    useRecommendations(refrigeratorId);
  const limitReached =
    data?.status === "LIMIT_REACHED" ||
    (job.error instanceof ApiError && job.error.status === 429);
  const generating =
    data?.status === "GENERATING" ||
    job.isPending ||
    Boolean(job.data && job.data.status !== "ALREADY_UP_TO_DATE");

  if (refrigeratorId === null)
    return (
      <PageLayout>
        <IngredientRefrigeratorRequiredState />
      </PageLayout>
    );
  if (error && !data)
    return (
      <PageLayout>
        <AsyncViewState
          status="error"
          title={
            error instanceof ApiError && error.status === 403
              ? "이 냉장고에 접근할 권한이 없어요"
              : error instanceof ApiError && error.status === 404
                ? "냉장고를 찾을 수 없어요"
                : "추천을 불러오지 못했어요"
          }
          description="다시 시도하거나 다른 냉장고를 확인해 주세요"
          action={
            <button
              type="button"
              className={asyncViewActionClassName}
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              다시 시도
            </button>
          }
        />
      </PageLayout>
    );
  if (!data)
    return (
      <PageLayout>
        <div className="px-5 pb-20">
          <PreparingState />
        </div>
      </PageLayout>
    );

  return (
    <PageLayout>
      <div className="flex flex-col gap-4 px-5 pt-2 pb-20">
        <section className="rounded-[4px] bg-white px-4 py-3 shadow-app-sm">
          <h2 className="m-0 font-app-heading text-[15px] font-black leading-tight text-app-ink">
            임박 재료를 먼저 쓰는 요리예요
          </h2>
          <p className="mb-0 mt-1.5 break-keep text-[12.5px] leading-[1.45] text-app-ink/60">
            보유 재료를 AI가 분석해 추천해요. 임박 재료가 많고 부족한 재료가
            적은 요리부터 보여드려요.
          </p>
        </section>
        {limitReached ? (
          <p
            role="status"
            className="m-0 rounded-[4px] bg-app-warning/15 px-4 py-2.5 text-[12.5px] font-bold"
          >
            오늘의 추천 생성을 모두 사용했어요. 내일 새로 받을 수 있어요.
          </p>
        ) : generating ? (
          <p
            role="status"
            className="m-0 rounded-[4px] bg-app-warning/15 px-4 py-2.5 text-[12.5px] font-bold"
          >
            새 추천을 준비하고 있어요. 다음 진입 때 반영돼요.
          </p>
        ) : null}
        {job.isError && !limitReached ? (
          <p role="alert" className="m-0 text-[13px] text-app-primary">
            {data.recipes.length > 0
              ? "새 추천을 만들지 못했어요. 기존 추천은 계속 볼 수 있어요."
              : "새 추천을 만들지 못했어요. 잠시 후 다시 시도해 주세요."}
          </p>
        ) : null}
        {data.recipes.length > 0 ? (
          <section aria-label="추천 요리 목록">
            <p className="text-[12.5px] text-app-ink/55">
              추천 요리 {data.recipes.length}개
            </p>
            <ul className="flex flex-col gap-2">
              {data.recipes.map((recipe) => (
                <li key={recipe.recipeId}>
                  <RecommendedRecipeCard
                    recipe={recipe}
                    recommendationId={data.recommendationId}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : job.isError && !limitReached ? (
          <AsyncViewState
            status="error"
            title="추천을 준비하지 못했어요"
            description="잠시 후 다시 시도해 주세요"
            action={
              <button
                type="button"
                className={asyncViewActionClassName}
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                다시 시도
              </button>
            }
          />
        ) : generating ||
          ((data.status === "EMPTY" || data.status === "STALE") &&
            !job.isError) ? (
          <PreparingState />
        ) : (
          <AsyncViewState
            status="empty"
            title={
              limitReached
                ? "오늘의 추천 생성을 모두 사용했어요"
                : "추천할 요리를 찾지 못했어요"
            }
            description={
              limitReached
                ? "내일 새로 받을 수 있어요"
                : "재료를 등록하면 새로운 추천을 받을 수 있어요"
            }
            action={
              <AppLink
                href={limitReached ? routes.home : routes.registerIngredient}
                className={asyncViewActionClassName}
              >
                {limitReached ? "홈으로 이동" : "재료 등록하기"}
              </AppLink>
            }
          />
        )}
      </div>
    </PageLayout>
  );
}
