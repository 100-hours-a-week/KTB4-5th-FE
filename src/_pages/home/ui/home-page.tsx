import { getHomeSummary, STOCK_TYPE_LIMIT } from "../model/home-summary";
import { HomeAttentionSection } from "./home-attention-section";
import { HomeCapacitySummary } from "./home-capacity-summary";
import { HomeRecommendationNotice } from "./home-recommendation-notice";

export function HomePage() {
  const summary = getHomeSummary();

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-[calc(var(--space-6)+var(--safe-bottom))] [-webkit-overflow-scrolling:touch]">
      <HomeCapacitySummary
        stockTypeCount={summary.stockTypeCount}
        stockTypeLimit={STOCK_TYPE_LIMIT}
      />
      <HomeAttentionSection items={summary.attentionItems} />
      <HomeRecommendationNotice />
    </main>
  );
}
