import { IngredientEditPage } from "@/_pages/ingredient-edit";

type IngredientEditRouteProps = {
  params: Promise<{ ingredientId: string }>;
};

export default async function IngredientEditRoute({
  params,
}: IngredientEditRouteProps) {
  const { ingredientId } = await params;

  return <IngredientEditPage ingredientId={ingredientId} />;
}
