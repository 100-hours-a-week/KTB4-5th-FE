"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { IngredientRefrigeratorRequiredState } from "@/entities/ingredient";
import { toTasteLabels, useTodayTaste } from "@/features/answer-taste-survey";
import { useRecommendations } from "@/features/prepare-recommendations";
import { ApiError } from "@/shared/api";
import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";
import { sortRecipes, type RecipeSort } from "../model/recipe-sort";
import { RecipeSortFilter } from "./recipe-sort-filter";
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
  const { data, error, isFetching, refetch, job, switchJob, switchToNew } =
    useRecommendations(refrigeratorId);
  const [sort, setSort] = useState<RecipeSort>("EXPIRING");
  const tasteIds = useTodayTaste();
  const limitReached =
    data?.status === "LIMIT_REACHED" ||
    (job.error instanceof ApiError && job.error.status === 429);
  const generating =
    (data?.status === "GENERATING" && data.generationTrigger !== "SCHEDULED") ||
    job.isPending;

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
              : error instanceof ApiError &&
                  error.code === "REFRIGERATOR-404-001"
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
          {tasteIds ? (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-app-ink/10 pt-3">
              <p className="m-0 min-w-0 truncate text-[12.5px] text-app-ink/60">
                오늘의 취향 ·{" "}
                <span className="font-bold text-app-ink">
                  {tasteIds.length > 0
                    ? toTasteLabels(tasteIds).join(", ")
                    : "상관없어요"}
                </span>
              </p>
              {generating || limitReached ? null : (
                <AppLink
                  href={routes.recommendationTaste}
                  className="flex-none text-[12.5px] font-black text-app-ink underline"
                >
                  취향 바꿔 다시 추천
                </AppLink>
              )}
            </div>
          ) : null}
        </section>
        {tasteIds === null && !generating && !limitReached ? (
          <AppLink
            href={routes.recommendationTaste}
            className="flex items-center justify-between gap-3 rounded-[4px] bg-app-ink px-4 py-3.5 text-white no-underline shadow-app-sm"
          >
            <span className="min-w-0">
              <span className="block font-app-heading text-[15px] font-black leading-tight">
                오늘의 취향을 알려주세요
              </span>
              <span className="mt-1 block break-keep text-[12.5px] leading-[1.45] text-white/70">
                인분 수, 난이도, 끌리는 맛을 고르면 맞춰 다시 추천해요
              </span>
            </span>
            <span
              aria-hidden="true"
              className="flex-none text-[18px] font-black"
            >
              ›
            </span>
          </AppLink>
        ) : null}
        {data.hasNewRecommendation ? (
          <section className="flex items-center justify-between gap-3 rounded-[4px] bg-app-ink px-4 py-2.5 text-white">
            <p role="status" className="m-0 break-keep text-[12.5px] font-bold">
              {switchJob.isError
                ? "새 추천으로 바꾸지 못했어요. 다시 시도해 주세요."
                : "새 추천이 준비됐어요."}
            </p>
            <button
              type="button"
              className="flex-none text-[12.5px] font-black text-white underline disabled:opacity-40"
              disabled={switchJob.isPending}
              onClick={switchToNew}
            >
              새 추천 보기
            </button>
          </section>
        ) : null}
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
            새 추천을 준비하고 있어요. 준비되면 알려 드릴게요.
          </p>
        ) : data.status === "STALE" &&
          data.recipes.length > 0 &&
          !data.hasNewRecommendation ? (
          <section className="flex items-center justify-between gap-3 rounded-[4px] bg-app-warning/15 px-4 py-2.5">
            <p className="m-0 break-keep text-[12.5px] font-bold">
              재고가 바뀌어 추천이 오래됐어요. 오늘{" "}
              {data.dailyGeneration.remaining}번 더 받을 수 있어요.
            </p>
            <AppLink
              href={routes.recommendationTaste}
              className="flex-none text-[12.5px] font-black text-app-ink underline"
            >
              다시 추천
            </AppLink>
          </section>
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
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="m-0 text-[12.5px] text-app-ink/55">
                추천 요리 {data.recipes.length}개
              </p>
              <RecipeSortFilter sort={sort} onSortChange={setSort} />
            </div>
            <ul className="flex flex-col gap-2">
              {sortRecipes(data.recipes, sort).map((recipe) => (
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
              <AppLink
                href={routes.recommendationTaste}
                className={asyncViewActionClassName}
              >
                다시 시도
              </AppLink>
            }
          />
        ) : generating ? (
          <PreparingState />
        ) : (data.status === "EMPTY" || data.status === "STALE") &&
          !limitReached ? (
          <AsyncViewState
            status="empty"
            title="아직 추천이 없어요"
            description="보유 재료로 만들 수 있는 요리를 추천받아 보세요"
            action={
              <AppLink
                href={routes.recommendationTaste}
                className={asyncViewActionClassName}
              >
                추천 받기
              </AppLink>
            }
          />
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
