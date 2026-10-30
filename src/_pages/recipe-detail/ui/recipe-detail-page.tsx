"use client";

import { HatChef3Outlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useRef, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyRecipe,
  recommendationQueries,
  type RecipeDetail,
} from "@/entities/recommendation";
import {
  refrigeratorQueries,
  useCurrentRefrigeratorId,
} from "@/entities/refrigerator";
import {
  invalidateIngredients,
  IngredientRefrigeratorRequiredState,
  formatDaysUntilExpiration,
} from "@/entities/ingredient";
import { ApiError } from "@/shared/api";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

import { routes } from "@/shared/routes";
import { getTodayInSeoul } from "@/shared/lib/seoul-date";
import { AppLink } from "@/shared/ui/app-link";
import { showAppToast } from "@/shared/ui/app-toast";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import {
  getRecipeConsumeRows,
  getRecipeIngredientState,
  type RecipeIngredientState,
} from "../model/recipe-ingredients";
import { RecipeConsumeSheet } from "./recipe-consume-sheet";

function IngredientStateBadge({ state }: { state: RecipeIngredientState }) {
  if (state.kind === "missing") {
    return (
      <Badge
        tone="outline"
        className="max-w-full wrap-anywhere whitespace-normal!"
      >
        미보유
      </Badge>
    );
  }

  if (state.kind === "short") {
    return (
      <Badge
        tone="highlight"
        className="max-w-full wrap-anywhere whitespace-normal!"
      >
        부족 · {state.shortage}
      </Badge>
    );
  }

  return (
    <Badge tone="muted" className="max-w-full wrap-anywhere whitespace-normal!">
      보유 · {formatDaysUntilExpiration(state.daysUntilExpiration)}
    </Badge>
  );
}

type RecipeDetailPageProps = {
  recipeId: string;
  recommendationId: string | null;
};

export function RecipeDetailPage({
  recipeId,
  recommendationId,
}: RecipeDetailPageProps) {
  const refrigeratorId = useCurrentRefrigeratorId();
  const detail = useQuery({
    ...recommendationQueries.detail(refrigeratorId ?? "", recipeId),
    enabled: Boolean(refrigeratorId),
  });
  const list = useQuery({
    ...recommendationQueries.list(refrigeratorId ?? ""),
    enabled: Boolean(refrigeratorId) && !recommendationId,
  });
  const resolvedRecommendationId =
    recommendationId ??
    (list.data?.recipes.some((recipe) => recipe.recipeId === recipeId)
      ? list.data.recommendationId
      : null);
  if (refrigeratorId === null) return <IngredientRefrigeratorRequiredState />;
  if (detail.error)
    return (
      <main className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto">
        <AsyncViewState
          status="error"
          title={
            detail.error instanceof ApiError && detail.error.status === 404
              ? "요리를 찾을 수 없어요"
              : detail.error instanceof ApiError && detail.error.status === 403
                ? "이 냉장고에 접근할 권한이 없어요"
                : "요리를 불러오지 못했어요"
          }
          action={
            <button
              className={asyncViewActionClassName}
              disabled={detail.isFetching}
              onClick={() => void detail.refetch()}
            >
              다시 시도
            </button>
          }
        />
      </main>
    );
  if (!detail.data || !refrigeratorId)
    return (
      <main className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto">
        <AsyncViewState status="loading" title="요리를 불러오는 중입니다" />
      </main>
    );
  return (
    <RecipeDetailContent
      key={`${refrigeratorId}:${recipeId}:${resolvedRecommendationId}`}
      refrigeratorId={refrigeratorId}
      recommendationId={resolvedRecommendationId}
      recipe={detail.data}
    />
  );
}

function RecipeDetailContent({
  refrigeratorId,
  recommendationId,
  recipe,
}: {
  refrigeratorId: string;
  recommendationId: string | null;
  recipe: RecipeDetail;
}) {
  const [isConsumeSheetOpen, setIsConsumeSheetOpen] = useState(false);
  // 응답 유실·시트 닫기 후 재시도에도 같은 조리 요청의 키를 유지한다.
  const requestKey = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const consume = useMutation({
    mutationFn: () => {
      if (!recommendationId)
        throw new Error("추천 목록에서 요리를 다시 선택해 주세요.");
      requestKey.current ??= crypto.randomUUID();
      return applyRecipe(
        refrigeratorId,
        { recommendationId, recipeId: recipe.recipeId },
        requestKey.current,
      );
    },
    onSuccess: () => {
      requestKey.current = null;
      setIsConsumeSheetOpen(false);
      void invalidateIngredients(queryClient, refrigeratorId);
      void queryClient.invalidateQueries({
        queryKey: refrigeratorQueries.mypage(refrigeratorId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: refrigeratorQueries.current().queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: ["refrigerators", refrigeratorId, "recipes"],
      });
      showAppToast({ message: "요리를 적용했어요", variant: "success" });
    },
  });
  const today = getTodayInSeoul();
  const consumeRows = getRecipeConsumeRows(recipe, today);
  const stockIngredients = recipe.ingredients;
  const summaryChips = [
    recipe.cookingTimeMinutes !== null
      ? `조리 ${recipe.cookingTimeMinutes}분`
      : null,
    recipe.targetServings !== null ? `${recipe.targetServings}인분` : null,
    recipe.expiringIngredientCount > 0
      ? `임박 재료 ${recipe.expiringIngredientCount}개`
      : null,
  ].filter((chip) => chip !== null);

  return (
    <PageActionLayout
      action={
        <Button
          className="w-full"
          disabled={!recommendationId}
          onClick={() => setIsConsumeSheetOpen(true)}
        >
          적용하기
        </Button>
      }
    >
      <div className="flex flex-col gap-4 px-5 pt-2 pb-20">
        {recipe.imageUrl ? (
          <Image
            unoptimized
            src={recipe.imageUrl}
            alt={recipe.name}
            width={600}
            height={360}
            className="h-[180px] w-full rounded-[4px] object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-[180px] place-items-center rounded-[4px] bg-app-neutral-100 text-app-neutral-400"
          >
            <Lineicons
              icon={HatChef3Outlined}
              size={40}
              strokeWidth={1.4}
              focusable="false"
            />
          </span>
        )}

        <div>
          <h2 className="m-0 wrap-anywhere font-app-heading text-[22px] font-black leading-tight text-app-ink">
            {recipe.name}
          </h2>
          {summaryChips.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {summaryChips.map((chip) => (
                <li key={chip}>
                  <Badge tone="muted" size="md">
                    {chip}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <section aria-labelledby="recipe-ingredients-heading">
          <h3
            id="recipe-ingredients-heading"
            className="m-0 font-app-heading text-[16px] font-black text-app-ink"
          >
            필요한 재료
          </h3>
          <ul className="mt-1 flex flex-col">
            {stockIngredients.map((ingredient) => {
              const state = getRecipeIngredientState(ingredient, today);
              const ingredientId =
                state.kind === "missing" ? null : state.ingredientId;

              return (
                <li
                  key={ingredient.recipeIngredientId}
                  className="grid grid-cols-2 items-center gap-2.5 border-app-neutral-200 py-3 [&+&]:border-t"
                >
                  {ingredientId ? (
                    <AppLink
                      href={routes.ingredientDetail(ingredientId)}
                      prefetch={false}
                      className="min-w-0 wrap-anywhere text-[15px] font-bold text-app-ink no-underline hover:text-app-primary"
                    >
                      {ingredient.name}
                    </AppLink>
                  ) : (
                    <span className="min-w-0 wrap-anywhere text-[15px] font-bold text-app-ink">
                      {ingredient.name}
                    </span>
                  )}
                  <span className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
                    <span className="max-w-full wrap-anywhere text-right text-[14px] text-app-ink/55">
                      {ingredient.amountText}
                    </span>
                    <IngredientStateBadge state={state} />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="recipe-steps-heading">
          <h3
            id="recipe-steps-heading"
            className="m-0 font-app-heading text-[16px] font-black text-app-ink"
          >
            만드는 순서
          </h3>
          <ol className="mt-3 flex flex-col gap-2.5">
            {recipe.steps.map((step) => (
              <li key={step.stepNo} className="flex items-start gap-3">
                <span className="grid size-[26px] flex-none place-items-center rounded-full bg-app-ink text-[13px] font-bold text-white">
                  {step.stepNo}
                </span>
                <span className="min-w-0 flex-1 pt-0.5 text-[14.5px] leading-[1.5] text-app-ink">
                  {step.instruction}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <p className="m-0 break-keep text-[12.5px] leading-[1.45] text-app-ink/50">
          {recommendationId
            ? "적용하면 비교 가능한 보유 재료가 차감돼요. 차감할 재료가 없어도 요리 기록은 저장돼요."
            : "추천 목록에서 요리를 다시 선택해 주세요."}
        </p>
      </div>

      <RecipeConsumeSheet
        open={isConsumeSheetOpen}
        status={
          consume.isPending ? "pending" : consume.isError ? "error" : "idle"
        }
        errorMessage={
          consume.error instanceof ApiError && consume.error.status === 409
            ? "요청 정보가 충돌했어요. 추천 목록을 확인한 뒤 다시 시도해 주세요."
            : consume.error instanceof ApiError &&
                (consume.error.status === 403 || consume.error.status === 404)
              ? "추천 또는 냉장고에 접근할 수 없어요. 추천 목록을 다시 확인해 주세요."
              : undefined
        }
        recipeName={recipe.name}
        rows={consumeRows}
        onDismiss={() => setIsConsumeSheetOpen(false)}
        onConfirm={() => consume.mutate()}
      />
    </PageActionLayout>
  );
}
