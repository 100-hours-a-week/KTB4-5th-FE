import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { getMockIngredientDetail } from "../model/mock-ingredient-detail";
import { IngredientDetailActions } from "./ingredient-detail-actions";
import { IngredientMemoNote } from "./ingredient-memo-note";
import { IngredientSummaryCard } from "./ingredient-summary-card";

type IngredientDetailPageProps = {
  ingredientId: string;
};

export function IngredientDetailPage({
  ingredientId,
}: IngredientDetailPageProps) {
  const ingredient = getMockIngredientDetail(ingredientId);

  return (
    <PageActionLayout
      action={<IngredientDetailActions ingredient={ingredient} />}
    >
      <IngredientSummaryCard ingredient={ingredient} />
      <IngredientMemoNote status={ingredient.status} />
    </PageActionLayout>
  );
}
