import { RecipeDetailPage } from "@/_pages/recipe-detail";

export default async function Page({
  params,
  searchParams,
}: PageProps<"/recommendations/[recipeId]">) {
  const [{ recipeId }, { recommendationId }] = await Promise.all([
    params,
    searchParams,
  ]);
  return (
    <RecipeDetailPage
      recipeId={recipeId}
      recommendationId={
        typeof recommendationId === "string" ? recommendationId : null
      }
    />
  );
}
