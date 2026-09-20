import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { getMockIngredientDetail } from "../model/mock-ingredient-detail";
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
      action={
        <div className="flex gap-2.5">
          <AppLink
            href={routes.ingredientEdit(ingredient.ingredientId)}
            className="inline-flex w-28 flex-none items-center justify-center rounded-[4px] border-[1.5px] border-app-ink bg-app-canvas py-[15px] font-app-heading text-[14px] font-bold leading-[1.2] text-app-ink no-underline hover:bg-app-neutral-100 hover:text-app-ink active:bg-app-neutral-200"
          >
            수정
          </AppLink>
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-[4px] border-0 bg-app-ink py-[15px] font-app-heading text-[14px] font-bold leading-[1.2] text-white hover:bg-app-neutral-800 active:bg-app-neutral-700"
          >
            만료 처리
          </button>
        </div>
      }
    >
      <IngredientSummaryCard ingredient={ingredient} />
      <IngredientMemoNote status={ingredient.status} />
    </PageActionLayout>
  );
}
