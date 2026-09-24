"use client";

import { useQuery } from "@tanstack/react-query";

import {
  DEFAULT_INGREDIENT_LIST_SORT,
  ingredientQueries,
  type IngredientListQuery,
} from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

import { type HomeSummary, toHomeSummary } from "../model/home-summary";
import { HomeAttentionSection } from "./home-attention-section";
import { HomeCapacitySummary } from "./home-capacity-summary";
import { HomeRecommendationNotice } from "./home-recommendation-notice";

const HOME_LIST_QUERY: IngredientListQuery = {
  filter: null,
  sort: DEFAULT_INGREDIENT_LIST_SORT,
};

export function HomePage() {
  const refrigeratorId = useCurrentRefrigeratorId();
  const {
    data: page,
    isError,
    refetch,
  } = useQuery({
    ...ingredientQueries.firstPage(refrigeratorId ?? "", HOME_LIST_QUERY),
    enabled: Boolean(refrigeratorId),
  });

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-[calc(var(--space-6)+var(--safe-bottom))] [-webkit-overflow-scrolling:touch]">
      {page ? (
        <HomeContent summary={toHomeSummary(page)} />
      ) : isError ? (
        <AsyncViewState
          status="error"
          title="재고를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요"
          action={
            <button
              type="button"
              onClick={() => void refetch()}
              className={asyncViewActionClassName}
            >
              다시 시도
            </button>
          }
        />
      ) : (
        <AsyncViewState status="loading" title="재고를 불러오는 중입니다" />
      )}
    </main>
  );
}

function HomeContent({ summary }: { summary: HomeSummary }) {
  return (
    <>
      <HomeCapacitySummary
        stockTypeCount={summary.stockTypeCount}
        stockTypeLimit={summary.stockTypeLimit}
      />
      <HomeAttentionSection items={summary.attentionItems} />
      <HomeRecommendationNotice />
    </>
  );
}
