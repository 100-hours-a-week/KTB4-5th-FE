import { IngredientDetailPage } from "@/_pages/ingredient-detail";

type IngredientDetailRouteProps = {
  params: Promise<{ ingredientId: string }>;
};

export default async function IngredientDetailRoute({
  params,
}: IngredientDetailRouteProps) {
  const { ingredientId } = await params;

  return <IngredientDetailPage ingredientId={ingredientId} />;
}
