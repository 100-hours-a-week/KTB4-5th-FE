import {
  parseIngredientListQuery,
  type RawQueryParams,
} from "@/entities/ingredient";

import {
  getMockExpiredSummary,
  getMockIngredientList,
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
  const expiredSummary = getMockExpiredSummary();
  const canDisposeExpired =
    query.filter === "EXPIRED" && expiredSummary.count > 0;

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-[calc(var(--space-6)+var(--safe-bottom))] [-webkit-overflow-scrolling:touch]">
      <IngredientControlsContainer
        query={query}
        filteredCount={list.filteredCount}
      />

      <section className="px-5 pt-4" aria-label="재고 목록">
        {canDisposeExpired ? (
          <div className="pb-4">
            <IngredientDisposeBanner expiredCount={expiredSummary.count} />
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
