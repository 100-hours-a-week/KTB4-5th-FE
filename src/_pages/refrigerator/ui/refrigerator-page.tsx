import {
  parseIngredientListQuery,
  type RawQueryParams,
} from "@/entities/ingredient";

import {
  getMockIngredientList,
  MOCK_REFRIGERATOR_ID,
} from "../model/mock-ingredient-list";
import { IngredientControlsContainer } from "./ingredient-controls-container";
import { IngredientDisposeBanner } from "./ingredient-dispose-banner";
import { IngredientListContainer } from "./ingredient-list-container";

type RefrigeratorPageProps = {
  queryParams: RawQueryParams;
};

// TODO: 무한 스크롤 연결 (HydrationBoundary 영역 내 InfiniteQuery으로 관리)
export function RefrigeratorPage({ queryParams }: RefrigeratorPageProps) {
  const query = parseIngredientListQuery(queryParams);
  const list = getMockIngredientList(query);
  // 만료 필터 목록의 조회 결과를 그대로 일괄 정리 대상으로 사용한다.
  const canDisposeExpired =
    query.filter === "EXPIRED" && list.filteredCount > 0;

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-[calc(var(--space-6)+var(--safe-bottom))] [-webkit-overflow-scrolling:touch]">
      <IngredientControlsContainer
        query={query}
        filteredCount={list.filteredCount}
      />

      <section className="px-5 pt-4" aria-label="재고 목록">
        {canDisposeExpired ? (
          <div className="pb-4">
            <IngredientDisposeBanner
              refrigeratorId={MOCK_REFRIGERATOR_ID}
              expiredCount={list.filteredCount}
              expiredIngredients={list.ingredients}
            />
          </div>
        ) : null}

        <div className="border-t border-dashed border-app-ink/20 pt-4">
          <IngredientListContainer
            query={query}
            ingredients={list.ingredients}
          />
        </div>
      </section>
    </main>
  );
}
